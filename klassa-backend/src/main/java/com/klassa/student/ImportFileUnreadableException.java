package com.klassa.student;

/**
 * Wraps any low-level failure while opening/parsing the uploaded file as an OOXML package (a
 * corrupt file, a `.xlsx` that isn't really a zip/OOXML package, a malformed `sheet1.xml`, etc.).
 * Kept distinct from {@link ImportRowLimitExceededException} and the header-mismatch {@code
 * BusinessRuleException} so {@link StudentService#importStudents} can translate each case to its
 * own {@code ErrorCode} instead of lumping every failure into "unreadable file".
 */
class ImportFileUnreadableException extends RuntimeException {

    ImportFileUnreadableException(Throwable cause) {
        super("Failed to read uploaded file as an OOXML workbook", cause);
    }
}
