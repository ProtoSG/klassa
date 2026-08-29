package com.klassa.student;

import com.klassa.student.dto.ImportRowError;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * Parses a single Excel data row into a {@link ParsedRow}, following the fixed 4-column
 * template (Nombres, Apellidos, Fecha de nacimiento, Sexo (M/F)). Collects every problem found in
 * the row — not just the first — and reports them together via a single {@link
 * RowValidationException}, so an admin fixing a bad row in the spreadsheet sees every issue at
 * once instead of re-uploading repeatedly for one error at a time.
 *
 * <p>Plain class, not a Spring bean: it holds no dependencies, so it's trivially unit-testable
 * in isolation (see {@code StudentImportRowParserTest}). Takes a {@link RawImportRow} — a POI-free
 * row snapshot produced by {@link StudentImportSheetReader} — rather than a POI DOM {@code Row},
 * so this class doesn't need to know whether the row came from a streaming SAX parse or a DOM
 * workbook.
 */
class StudentImportRowParser {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final int COL_FIRST_NAME = 0;
    private static final int COL_LAST_NAME = 1;
    private static final int COL_BIRTH_DATE = 2;
    private static final int COL_GENDER = 3;

    ParsedRow parse(RawImportRow row) {
        int rowNumber = row.rowNumber();
        List<ImportRowError> errors = new ArrayList<>();

        String firstName = text(row, COL_FIRST_NAME);
        if (firstName == null || firstName.isBlank()) {
            errors.add(new ImportRowError(rowNumber, "Nombres", "El nombre es obligatorio"));
        }

        String lastName = text(row, COL_LAST_NAME);
        if (lastName == null || lastName.isBlank()) {
            errors.add(new ImportRowError(rowNumber, "Apellidos", "El apellido es obligatorio"));
        }

        LocalDate birthDate = parseBirthDate(row, rowNumber, errors);
        Gender gender = parseGender(row, rowNumber, errors);

        if (!errors.isEmpty()) {
            throw new RowValidationException(errors);
        }

        return new ParsedRow(firstName, lastName, birthDate, gender);
    }

    private LocalDate parseBirthDate(RawImportRow row, int rowNumber, List<ImportRowError> errors) {
        RawImportRow.RawCell cell = row.cell(COL_BIRTH_DATE);

        if (cell.excelDate() != null) {
            return requirePastDate(cell.excelDate(), rowNumber, errors);
        }

        String raw = cell.text() == null ? null : cell.text().trim();
        if (raw == null || raw.isBlank()) {
            errors.add(new ImportRowError(rowNumber, "Fecha de nacimiento", "La fecha de nacimiento es obligatoria"));
            return null;
        }

        LocalDate date;
        try {
            date = LocalDate.parse(raw, DATE_FORMAT);
        } catch (DateTimeParseException e) {
            errors.add(new ImportRowError(rowNumber, "Fecha de nacimiento",
                    "Formato de fecha inválido, use dd/MM/yyyy"));
            return null;
        }
        return requirePastDate(date, rowNumber, errors);
    }

    private LocalDate requirePastDate(LocalDate date, int rowNumber, List<ImportRowError> errors) {
        if (!date.isBefore(LocalDate.now())) {
            errors.add(new ImportRowError(rowNumber, "Fecha de nacimiento",
                    "La fecha de nacimiento debe ser en el pasado"));
            return null;
        }
        return date;
    }

    private Gender parseGender(RawImportRow row, int rowNumber, List<ImportRowError> errors) {
        String raw = text(row, COL_GENDER);
        if (raw == null || raw.isBlank()) {
            errors.add(new ImportRowError(rowNumber, "Sexo (M/F)", "El sexo es obligatorio"));
            return null;
        }
        try {
            return Gender.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            errors.add(new ImportRowError(rowNumber, "Sexo (M/F)", "El sexo debe ser 'M' o 'F'"));
            return null;
        }
    }

    private String text(RawImportRow row, int colIndex) {
        String value = row.cell(colIndex).text();
        return value == null ? null : value.trim();
    }

    record ParsedRow(String firstName, String lastName, LocalDate birthDate, Gender gender) {}
}
