package com.klassa.student.dto;

/**
 * A single row-level problem found while importing students from Excel.
 * {@code rowNumber} is the 1-based Excel row as the user sees it in the spreadsheet
 * (header row = 1, first data row = 2).
 */
public record ImportRowError(int rowNumber, String field, String message) {}
