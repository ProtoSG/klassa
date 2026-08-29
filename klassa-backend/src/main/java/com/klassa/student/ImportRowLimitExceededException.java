package com.klassa.student;

/**
 * Thrown from inside {@link StudentImportSheetReader}'s SAX row callback as soon as the number of
 * `<row>` elements encountered (header + data, blank or not) exceeds the configured cap. Being an
 * unchecked exception thrown from a {@code org.xml.sax.ContentHandler} method, it propagates
 * straight out of {@code XMLReader.parse(...)} without the SAX parser catching or wrapping it —
 * this is what lets the cap abort the parse mid-stream instead of only being checked after a full
 * read. Caught by {@link StudentService#importStudents} and translated into the user-visible
 * {@code IMPORT_TOO_MANY_ROWS} business error.
 */
class ImportRowLimitExceededException extends RuntimeException {

    ImportRowLimitExceededException(int maxRows) {
        super("Import exceeds the maximum of " + maxRows + " data row(s)");
    }
}
