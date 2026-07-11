package com.klassa.student.dto;

import java.util.List;

/**
 * Outcome of a bulk student import. Each data row is processed independently, so a file can
 * partially succeed: {@code successCount} students were created and {@code errors} lists every
 * row that failed, without aborting the rest of the file.
 */
public record ImportResult(int totalRows, int successCount, int failureCount, List<ImportRowError> errors) {}
