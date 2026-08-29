package com.klassa.student;

import com.klassa.shared.exception.BusinessRuleException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.util.XMLHelper;
import org.apache.poi.xssf.eventusermodel.XSSFReader;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.xml.sax.InputSource;
import org.xml.sax.XMLReader;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringReader;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Integration-level coverage of {@link StudentImportSheetReader}, the actual SAX streaming
 * engine — the highest-risk new code in this change, since it hand-rolls the SharedStrings /
 * StylesTable / date-format resolution that POI's DOM API normally does for you.
 *
 * <p>Test fixtures are built with POI's DOM {@code XSSFWorkbook} API purely as test tooling (to
 * produce a real `.xlsx` byte stream) — that's not a regression back to DOM parsing in production
 * code, {@link StudentImportSheetReader} itself never touches {@code XSSFWorkbook}.
 */
class StudentImportSheetReaderTest {

    private static final List<String> HEADERS =
            List.of("Nombres", "Apellidos", "Fecha de nacimiento", "Sexo (M/F)");

    private byte[] buildWorkbook(String[][] rows, int dateStyleRow, int dateStyleCol, LocalDate dateStyleValue)
            throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet();
            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("dd/mm/yyyy"));

            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r);
                for (int c = 0; c < rows[r].length; c++) {
                    if (r == dateStyleRow && c == dateStyleCol) {
                        Cell cell = row.createCell(c);
                        cell.setCellStyle(dateStyle);
                        cell.setCellValue(dateStyleValue);
                    } else if (rows[r][c] != null) {
                        row.createCell(c).setCellValue(rows[r][c]);
                    }
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private MockMultipartFile asMultipartFile(byte[] bytes) {
        return new MockMultipartFile("file", "import.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);
    }

    @Test
    void read_resolvesExcelDateAndSharedStrings() throws Exception {
        LocalDate birthDate = LocalDate.of(2012, 6, 15);
        String[][] rows = {
                HEADERS.toArray(new String[0]),
                {"Ana", "Repetido", null, "F"},
                {"Luis", "Repetido", null, "M"}, // same lastName -> exercises shared-strings reuse
        };
        byte[] bytes = buildWorkbook(rows, 1, 2, birthDate);

        StudentImportSheetReader reader = new StudentImportSheetReader(HEADERS, 2000);
        List<RawImportRow> collected = new ArrayList<>();
        reader.read(asMultipartFile(bytes), collected::add);

        assertThat(collected).hasSize(2);

        RawImportRow first = collected.get(0);
        assertThat(first.rowNumber()).isEqualTo(2);
        assertThat(first.cell(0).text()).isEqualTo("Ana");
        assertThat(first.cell(1).text()).isEqualTo("Repetido");
        assertThat(first.cell(2).excelDate()).isEqualTo(birthDate);
        assertThat(first.cell(3).text()).isEqualTo("F");

        RawImportRow second = collected.get(1);
        assertThat(second.rowNumber()).isEqualTo(3);
        assertThat(second.cell(0).text()).isEqualTo("Luis");
        assertThat(second.cell(1).text()).isEqualTo("Repetido");
        assertThat(second.cell(3).text()).isEqualTo("M");
    }

    @Test
    void read_stringDateCell_hasNoExcelDateButKeepsText() throws Exception {
        String[][] rows = {
                HEADERS.toArray(new String[0]),
                {"Ana", "Gómez", "15/01/2010", "F"},
        };
        byte[] bytes = buildWorkbook(rows, -1, -1, null);

        StudentImportSheetReader reader = new StudentImportSheetReader(HEADERS, 2000);
        List<RawImportRow> collected = new ArrayList<>();
        reader.read(asMultipartFile(bytes), collected::add);

        assertThat(collected).hasSize(1);
        RawImportRow.RawCell birthCell = collected.get(0).cell(2);
        assertThat(birthCell.excelDate()).isNull();
        assertThat(birthCell.text()).isEqualTo("15/01/2010");
    }

    @Test
    void read_invalidHeader_throwsBusinessRuleException() throws Exception {
        String[][] rows = {
                {"Nombre incorrecto", "Apellidos", "Fecha de nacimiento", "Sexo (M/F)"},
                {"Ana", "Gómez", "15/01/2010", "F"},
        };
        byte[] bytes = buildWorkbook(rows, -1, -1, null);

        StudentImportSheetReader reader = new StudentImportSheetReader(HEADERS, 2000);

        assertThatThrownBy(() -> reader.read(asMultipartFile(bytes), row -> { }))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void read_moreRowsThanCap_abortsMidStream() throws Exception {
        int maxDataRows = 5;
        int totalRows = maxDataRows + 20; // header + way more data rows than the cap allows
        String[][] rows = new String[totalRows + 1][];
        rows[0] = HEADERS.toArray(new String[0]);
        for (int i = 1; i <= totalRows; i++) {
            rows[i] = new String[] {"Nombre" + i, "Apellido" + i, "01/01/2015", "F"};
        }
        byte[] bytes = buildWorkbook(rows, -1, -1, null);

        StudentImportSheetReader reader = new StudentImportSheetReader(HEADERS, maxDataRows);
        List<RawImportRow> collected = new ArrayList<>();

        assertThatThrownBy(() -> reader.read(asMultipartFile(bytes), collected::add))
                .isInstanceOf(ImportRowLimitExceededException.class);

        // The parse must abort as soon as the cap is crossed -- never finishing (and therefore
        // never handing every row to the callback).
        assertThat(collected.size()).isLessThanOrEqualTo(maxDataRows);
    }

    @Test
    void read_corruptFile_throwsUnreadableFileException() {
        StudentImportSheetReader reader = new StudentImportSheetReader(HEADERS, 2000);
        byte[] garbage = "this is not a zip/xlsx file".getBytes();

        assertThatThrownBy(() -> reader.read(asMultipartFile(garbage), row -> { }))
                .isInstanceOf(ImportFileUnreadableException.class);
    }

    @Test
    void validate_moreRowsThanCap_throwsWithoutInvokingCallback() throws Exception {
        int maxDataRows = 5;
        int totalRows = maxDataRows + 20;
        String[][] rows = new String[totalRows + 1][];
        rows[0] = HEADERS.toArray(new String[0]);
        for (int i = 1; i <= totalRows; i++) {
            rows[i] = new String[] {"Nombre" + i, "Apellido" + i, "01/01/2015", "F"};
        }
        byte[] bytes = buildWorkbook(rows, -1, -1, null);

        StudentImportSheetReader reader = new StudentImportSheetReader(HEADERS, maxDataRows);

        // Phase-1 validation must reject the oversized file on its own -- callers rely on this to
        // never touch persistence for a file that's going to be rejected anyway.
        assertThatThrownBy(() -> reader.validate(asMultipartFile(bytes)))
                .isInstanceOf(ImportRowLimitExceededException.class);
    }

    /**
     * BLOCKER 1 regression test: exercises {@link StudentImportSheetReader.SheetHandler} directly
     * against hand-written SAX XML (bypassing {@code OPCPackage}/{@code XSSFReader} entirely),
     * because POI's own writer -- used by every other test fixture in this class -- always emits
     * correct, ascending {@code r} attributes and can never produce the crafted input needed to
     * exercise this attack path: a file with many rows all claiming the same (or oscillating)
     * {@code r} value, which would let a crafted file bypass the row-count cap if the cap were
     * (incorrectly) enforced against {@code r} instead of an internal, attacker-independent count
     * of physical {@code <row>} elements.
     */
    @Test
    void sheetHandler_repeatedRAttribute_doesNotBypassRowCountCap() throws Exception {
        int maxDataRows = 5;
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
        xml.append("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">");
        xml.append("<sheetData>");
        xml.append("<row r=\"1\"></row>");
        // Attacker repeats the same `r` value far beyond the cap -- a real crafted file could
        // repeat this millions of times while staying tiny and highly compressible.
        int attackerRowCount = maxDataRows + 50;
        for (int i = 0; i < attackerRowCount; i++) {
            xml.append("<row r=\"2\"></row>");
        }
        xml.append("</sheetData></worksheet>");

        // Empty expectedHeaders: this test is only about the row-count cap, not header validation.
        StudentImportSheetReader.SheetHandler handler = new StudentImportSheetReader.SheetHandler(
                null, null, false, List.of(), maxDataRows, row -> { });

        XMLReader xmlReader = XMLHelper.newXMLReader();
        xmlReader.setContentHandler(handler);

        assertThatThrownBy(() -> xmlReader.parse(new InputSource(new StringReader(xml.toString()))))
                .isInstanceOf(ImportRowLimitExceededException.class);
    }

    /**
     * BLOCKER 2 regression test: a row whose cells omit the {@code r} attribute entirely (some
     * legitimate non-Excel `.xlsx` generators do this) must still resolve every column in order.
     * Built via raw XML, same as above, since POI's writer always emits explicit per-cell refs.
     */
    @Test
    void sheetHandler_cellsWithoutRAttribute_resolveColumnsInOrder() throws Exception {
        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
                + "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">"
                + "<sheetData>"
                + "<row r=\"1\"></row>"
                + "<row r=\"2\">"
                + "<c t=\"inlineStr\"><is><t>Ana</t></is></c>"
                + "<c t=\"inlineStr\"><is><t>Gomez</t></is></c>"
                + "<c t=\"inlineStr\"><is><t>15/01/2010</t></is></c>"
                + "<c t=\"inlineStr\"><is><t>F</t></is></c>"
                + "</row>"
                + "</sheetData></worksheet>";

        List<RawImportRow> collected = new ArrayList<>();
        StudentImportSheetReader.SheetHandler handler = new StudentImportSheetReader.SheetHandler(
                null, null, false, List.of(), 2000, collected::add);

        XMLReader xmlReader = XMLHelper.newXMLReader();
        xmlReader.setContentHandler(handler);
        xmlReader.parse(new InputSource(new StringReader(xml)));

        assertThat(collected).hasSize(1);
        RawImportRow row = collected.get(0);
        assertThat(row.cell(0).text()).isEqualTo("Ana");
        assertThat(row.cell(1).text()).isEqualTo("Gomez");
        assertThat(row.cell(2).text()).isEqualTo("15/01/2010");
        assertThat(row.cell(3).text()).isEqualTo("F");
    }

    @Test
    void readDate1904_workbookXmlUnreadable_returnsFalseNotThrow() throws Exception {
        XSSFReader xssfReader = mock(XSSFReader.class);
        when(xssfReader.getWorkbookData()).thenThrow(new IOException("workbook.xml missing/unreadable"));

        StudentImportSheetReader reader = new StudentImportSheetReader(HEADERS, 2000);

        assertThat(reader.readDate1904(xssfReader)).isFalse();
    }
}
