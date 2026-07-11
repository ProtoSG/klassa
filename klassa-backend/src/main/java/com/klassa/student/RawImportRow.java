package com.klassa.student;

import java.time.LocalDate;

/**
 * Snapshot of a single Excel row's first {@value #COLUMN_COUNT} columns, decoupled from POI's DOM
 * types (no {@code org.apache.poi.ss.usermodel} import here on purpose). Produced by {@link
 * StudentImportSheetReader} while streaming a `.xlsx` file with POI's SAX ("Big Grid") event API,
 * and consumed by {@link StudentImportRowParser} — neither side needs to know a row ever lived in
 * a DOM {@code Row}/{@code Cell}.
 *
 * <p>{@code cells} always has length {@value #COLUMN_COUNT}; a column missing from the row's XML
 * (e.g. a totally empty cell that Excel omitted) is represented as {@link #EMPTY_CELL} rather than
 * {@code null}, so callers never need a null-check on the array element itself — use {@link
 * #cell(int)} to read defensively.
 */
record RawImportRow(int rowNumber, RawCell[] cells) {

    static final int COLUMN_COUNT = 4;
    static final int BIRTH_DATE_COLUMN = 2;

    static final RawCell EMPTY_CELL = new RawCell(null, null);

    /** Returns the cell at {@code index}, or {@link #EMPTY_CELL} if that column wasn't present. */
    RawCell cell(int index) {
        RawCell cell = cells[index];
        return cell != null ? cell : EMPTY_CELL;
    }

    /**
     * @param text       raw resolved cell text (shared-string / inline-string / formula string, or
     *                   the plain numeric string for a numeric cell); {@code null} if the column was
     *                   absent from the row's XML.
     * @param excelDate  populated only when this cell was a date-formatted numeric cell — i.e. its
     *                   style's number format looked like a date per {@code DateUtil.isADateFormat}.
     *                   {@code null} otherwise, even if {@code text} holds a raw numeric string.
     */
    record RawCell(String text, LocalDate excelDate) {}
}
