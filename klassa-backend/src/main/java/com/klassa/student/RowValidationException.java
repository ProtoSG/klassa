package com.klassa.student;

import com.klassa.student.dto.ImportRowError;

import java.util.List;

/**
 * Internal control-flow signal used only between {@link StudentImportRowParser} and the import
 * loop in {@link StudentService}. Never reaches {@code GlobalExceptionHandler} — the loop catches
 * it and turns it into row-level {@link ImportRowError} data instead of aborting the whole file.
 */
class RowValidationException extends RuntimeException {

    private final List<ImportRowError> errors;

    RowValidationException(List<ImportRowError> errors) {
        super("Row validation failed: " + errors.size() + " problem(s)");
        this.errors = errors;
    }

    List<ImportRowError> getErrors() {
        return errors;
    }
}
