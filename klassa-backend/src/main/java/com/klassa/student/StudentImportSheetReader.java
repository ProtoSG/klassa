package com.klassa.student;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import org.apache.poi.openxml4j.opc.OPCPackage;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.util.XMLHelper;
import org.apache.poi.xssf.eventusermodel.XSSFReader;
import org.apache.poi.xssf.model.SharedStrings;
import org.apache.poi.xssf.model.StylesTable;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;
import org.xml.sax.Attributes;
import org.xml.sax.InputSource;
import org.xml.sax.XMLReader;
import org.xml.sax.helpers.DefaultHandler;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

/**
 * Streams a `.xlsx` sheet row-by-row using POI's SAX ("Big Grid") event API instead of the DOM
 * ({@code XSSFWorkbook}) API. Only the first {@value RawImportRow#COLUMN_COUNT} columns are read
 * (the fixed import template); anything past column D is ignored.
 *
 * <p>This is the actual fix for the eager-DOM-parse issue: rows are handed to the caller's {@link
 * RowCallback} one at a time as the parser encounters them, never accumulated into a list, and the
 * header row / row-count cap are both enforced <em>during</em> parsing (from inside SAX callbacks)
 * so a crafted file is rejected mid-stream — before the rest of the sheet is even read off disk,
 * let alone materialized into objects.
 *
 * <p><b>Known, accepted characteristic (not a gap):</b> {@link XSSFReader#getSharedStringsTable()}
 * loads the entire {@code sharedStrings.xml} table into memory up front, and {@code
 * OPCPackage.open(InputStream)} itself buffers the raw (still-compressed) zip bytes of the upload
 * to get random access to the zip central directory. Both are unavoidable, well-documented parts
 * of this exact streaming pattern (POI's own "Reading Sheet with the low-level SAX API" example
 * does the same) — string cells can't be resolved without the shared-strings table, and a zip
 * can't be read from a forward-only stream without buffering it. Neither of these re-introduces
 * the bug this class fixes: both are bounded by the upload's own (compressed) byte size, not by an
 * attacker-controlled decompression/object-graph blow-up, and neither depends on row count.
 */
class StudentImportSheetReader {

    private static final Logger log = LoggerFactory.getLogger(StudentImportSheetReader.class);

    @FunctionalInterface
    interface RowCallback {
        void onRow(RawImportRow row);
    }

    private final List<String> expectedHeaders;
    private final int maxDataRows;

    StudentImportSheetReader(List<String> expectedHeaders, int maxDataRows) {
        this.expectedHeaders = expectedHeaders;
        this.maxDataRows = maxDataRows;
    }

    /**
     * Phase-1, validate-only pass: streams the sheet purely to validate the header row and enforce
     * the row-count cap, without invoking any per-row callback. Used by callers that persist each
     * row incrementally (own transaction per row, committed immediately — see {@code
     * StudentService#importStudents}) so that an oversized or malformed file is rejected <em>before
     * any row is parsed or persisted</em>, instead of only failing once the cap is crossed
     * mid-import after earlier rows already committed.
     *
     * <p>Shares 100% of the SAX row/cell-assembly logic in {@link #read} — the no-op callback is
     * what makes this "validate only", not a separate parsing path.
     *
     * @throws BusinessRuleException           (IMPORT_INVALID_TEMPLATE) if the header row doesn't
     *                                          match {@link #expectedHeaders} exactly.
     * @throws ImportRowLimitExceededException as soon as a row index beyond {@code 1 +
     *                                          maxDataRows} is encountered, header or not, blank
     *                                          or not.
     * @throws ImportFileUnreadableException   for any other failure opening/parsing the file.
     */
    void validate(MultipartFile file) {
        read(file, row -> { });
    }

    /**
     * Streams the sheet, invoking {@code callback} once per data row (row 2 onward). The header
     * row (row 1) is validated internally as soon as it's read and never reaches the callback.
     *
     * @throws BusinessRuleException           (IMPORT_INVALID_TEMPLATE) if the header row doesn't
     *                                          match {@link #expectedHeaders} exactly.
     * @throws ImportRowLimitExceededException as soon as a row index beyond {@code 1 +
     *                                          maxDataRows} is encountered, header or not, blank
     *                                          or not.
     * @throws ImportFileUnreadableException   for any other failure opening/parsing the file (not
     *                                          a genuine .xlsx / OOXML package, corrupt sheet XML,
     *                                          etc).
     */
    void read(MultipartFile file, RowCallback callback) {
        try (InputStream in = file.getInputStream()) {
            readInternal(in, callback);
        } catch (ImportRowLimitExceededException | BusinessRuleException e) {
            // Our own control-flow signals, thrown from inside the SAX handler below and
            // propagated unchanged by the JDK's SAX parser (RuntimeExceptions thrown from
            // ContentHandler callbacks are not caught/wrapped by javax.xml.parsers' default
            // implementation) — let them through as-is instead of falling into the catch-all.
            throw e;
        } catch (Exception e) {
            throw new ImportFileUnreadableException(e);
        }
    }

    private void readInternal(InputStream in, RowCallback callback) throws Exception {
        // `true` expresses read-only intent; there's no PackageAccess-based overload for a
        // stream-based open (streams can't be written back to a source anyway), but this at least
        // avoids OPCPackage setting up write-capable internals it will never use.
        try (OPCPackage pkg = OPCPackage.open(in, true)) {
            XSSFReader xssfReader = new XSSFReader(pkg);
            SharedStrings sharedStrings = xssfReader.getSharedStringsTable();
            StylesTable styles = xssfReader.getStylesTable();
            boolean use1904 = readDate1904(xssfReader);

            XMLReader xmlReader = XMLHelper.newXMLReader();
            xmlReader.setContentHandler(
                    new SheetHandler(sharedStrings, styles, use1904, expectedHeaders, maxDataRows, callback));

            try (InputStream sheetStream = xssfReader.getSheetsData().next()) {
                xmlReader.parse(new InputSource(sheetStream));
            } catch (RuntimeException e) {
                // Defensive unwrap: if some XMLReader implementation ever wraps a handler's
                // RuntimeException instead of propagating it as-is, don't let it get lost as a
                // generic parse failure — surface our own marker exception instead.
                if (e.getCause() instanceof ImportRowLimitExceededException limitEx) {
                    throw limitEx;
                }
                if (e.getCause() instanceof BusinessRuleException ruleEx) {
                    throw ruleEx;
                }
                throw e;
            }
        }
    }

    // Package-private (not private) purely so the untested catch-all below can be exercised
    // directly against a mocked XSSFReader in StudentImportSheetReaderTest, without needing to
    // hand-craft an OOXML package with a missing/corrupt workbook.xml part.
    boolean readDate1904(XSSFReader reader) throws IOException {
        try (InputStream workbookXml = reader.getWorkbookData()) {
            String xml = new String(workbookXml.readAllBytes(), StandardCharsets.UTF_8);
            int idx = xml.indexOf("date1904");
            if (idx < 0) return false;
            int eq = xml.indexOf('=', idx);
            if (eq < 0) return false;
            int startQuote = xml.indexOf('"', eq);
            int endQuote = startQuote < 0 ? -1 : xml.indexOf('"', startQuote + 1);
            if (startQuote < 0 || endQuote < 0) return false;
            String value = xml.substring(startQuote + 1, endQuote);
            return "1".equals(value) || "true".equalsIgnoreCase(value);
        } catch (Exception e) {
            return false;
        }
    }

    // Package-private (not private) so StudentImportSheetReaderTest can drive it directly against
    // hand-written SAX input, in isolation from OPCPackage/XSSFReader — the only practical way to
    // exercise a crafted/adversarial `r` attribute, since POI's own writer (used elsewhere in the
    // test fixtures) always emits correct, ascending `r` values.
    static final class SheetHandler extends DefaultHandler {

        private final SharedStrings sharedStrings;
        private final StylesTable styles;
        private final boolean use1904;
        private final List<String> expectedHeaders;
        private final int maxRowNumber; // 1 (header) + maxDataRows
        private final RowCallback callback;
        private final StringBuilder buffer = new StringBuilder();

        // Counts every physical <row> start element encountered, completely independent of
        // whatever the (attacker-controlled) `r` attribute claims. This — not currentRowNumber
        // below — is what the row-count cap is enforced against; see BLOCKER 1 in the review that
        // introduced this field.
        private int physicalRowCount;

        private int currentRowNumber;
        private RawImportRow.RawCell[] currentCells;
        private int currentColumn = -1;
        private String currentCellType;
        private Integer currentStyleIndex;
        private boolean capturingText;

        SheetHandler(SharedStrings sharedStrings, StylesTable styles, boolean use1904,
                     List<String> expectedHeaders, int maxDataRows, RowCallback callback) {
            this.sharedStrings = sharedStrings;
            this.styles = styles;
            this.use1904 = use1904;
            this.expectedHeaders = expectedHeaders;
            this.maxRowNumber = 1 + maxDataRows;
            this.callback = callback;
        }

        @Override
        public void startElement(String uri, String localName, String qName, Attributes attributes) {
            switch (qName) {
                case "row" -> {
                    physicalRowCount++;
                    if (physicalRowCount > maxRowNumber) {
                        throw new ImportRowLimitExceededException(maxRowNumber - 1);
                    }
                    // `r` is only used for display/labeling (row numbers in validation-error
                    // messages) and to correctly number legitimate files where Excel omits fully
                    // blank rows from the XML entirely. It must never influence the cap decision
                    // above — an attacker fully controls this attribute.
                    String rAttr = attributes.getValue("r");
                    int rowNumber = rAttr != null ? Integer.parseInt(rAttr) : currentRowNumber + 1;
                    currentRowNumber = rowNumber;
                    currentCells = new RawImportRow.RawCell[RawImportRow.COLUMN_COUNT];
                    // Row-scoped column tracker: reset only here, at row start, not after every
                    // cell (see BLOCKER 2) so the "no `r` on this cell" fallback below correctly
                    // increments from the true previous column within this row.
                    currentColumn = -1;
                }
                case "c" -> {
                    String ref = attributes.getValue("r");
                    currentColumn = ref != null ? columnIndex(ref) : currentColumn + 1;
                    currentCellType = attributes.getValue("t");
                    String sAttr = attributes.getValue("s");
                    currentStyleIndex = sAttr != null ? Integer.parseInt(sAttr) : null;
                }
                case "v", "t" -> {
                    buffer.setLength(0);
                    capturingText = true;
                }
                default -> { }
            }
        }

        @Override
        public void characters(char[] ch, int start, int length) {
            if (capturingText) {
                buffer.append(ch, start, length);
            }
        }

        @Override
        public void endElement(String uri, String localName, String qName) {
            switch (qName) {
                case "v", "t" -> capturingText = false;
                case "c" -> {
                    if (currentCells != null) {
                        if (currentColumn >= 0 && currentColumn < RawImportRow.COLUMN_COUNT) {
                            currentCells[currentColumn] = resolveCell();
                        } else if (currentColumn < 0) {
                            // columnIndex() couldn't resolve any column letters out of a malformed
                            // `r` ref (e.g. missing/garbled). Don't crash the whole import over one
                            // cell -- just make it diagnosable instead of silently dropping it.
                            log.warn("Skipping cell with unresolvable column reference in row {}",
                                    currentRowNumber);
                        }
                        // else: currentColumn >= COLUMN_COUNT, a column past the fixed 4-column
                        // template we read -- intentionally ignored, not a warning case.
                    }
                    // currentColumn is intentionally NOT reset here -- it's row-scoped state (see
                    // the row-start reset above), so the next cell's "no `r` attribute" fallback
                    // increments from the true previous column instead of always evaluating -1 + 1.
                    currentCellType = null;
                    currentStyleIndex = null;
                    buffer.setLength(0);
                }
                case "row" -> {
                    RawImportRow row = new RawImportRow(currentRowNumber, currentCells);
                    if (currentRowNumber == 1) {
                        validateHeader(row);
                    } else {
                        callback.onRow(row);
                    }
                    currentCells = null;
                }
                default -> { }
            }
        }

        private RawImportRow.RawCell resolveCell() {
            String raw = buffer.toString();
            if ("s".equals(currentCellType)) {
                if (raw.isBlank()) return new RawImportRow.RawCell("", null);
                int idx = Integer.parseInt(raw.trim());
                String resolved = sharedStrings.getItemAt(idx).getString();
                return new RawImportRow.RawCell(resolved, null);
            }
            if ("str".equals(currentCellType) || "inlineStr".equals(currentCellType)) {
                return new RawImportRow.RawCell(raw, null);
            }

            // Numeric cell (t attribute absent, or "n"). Only resolve an excelDate for the
            // birth-date column, and only when the cell's own style says it's date-formatted.
            LocalDate excelDate = null;
            if (currentColumn == RawImportRow.BIRTH_DATE_COLUMN && currentStyleIndex != null && !raw.isBlank()) {
                XSSFCellStyle style = styles.getStyleAt(currentStyleIndex);
                if (style != null && DateUtil.isADateFormat(style.getDataFormat(), style.getDataFormatString())) {
                    try {
                        excelDate = DateUtil.getLocalDateTime(Double.parseDouble(raw), use1904).toLocalDate();
                    } catch (NumberFormatException ignored) {
                        // Leave excelDate null; the row parser will try the raw text as a
                        // dd/MM/yyyy string and report its own validation error.
                    }
                }
            }
            return new RawImportRow.RawCell(raw, excelDate);
        }

        private void validateHeader(RawImportRow header) {
            for (int i = 0; i < expectedHeaders.size(); i++) {
                String value = header.cell(i).text();
                if (value != null) {
                    value = value.trim();
                }
                if (!expectedHeaders.get(i).equals(value)) {
                    throw new BusinessRuleException(ErrorCode.IMPORT_INVALID_TEMPLATE);
                }
            }
        }

        /** Converts a cell reference like "C7" into a zero-based column index (2). */
        private static int columnIndex(String cellRef) {
            int index = 0;
            for (int i = 0; i < cellRef.length(); i++) {
                char c = cellRef.charAt(i);
                if (c < 'A' || c > 'Z') break;
                index = index * 26 + (c - 'A' + 1);
            }
            return index - 1;
        }
    }
}
