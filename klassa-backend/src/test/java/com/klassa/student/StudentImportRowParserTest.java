package com.klassa.student;

import com.klassa.student.dto.ImportRowError;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StudentImportRowParserTest {

    private final StudentImportRowParser parser = new StudentImportRowParser();

    private static RawImportRow.RawCell text(String value) {
        return new RawImportRow.RawCell(value, null);
    }

    private static RawImportRow.RawCell excelDate(LocalDate date) {
        return new RawImportRow.RawCell(null, date);
    }

    private static RawImportRow row(int rowNumber, RawImportRow.RawCell firstName, RawImportRow.RawCell lastName,
                                     RawImportRow.RawCell birthDate, RawImportRow.RawCell gender) {
        return new RawImportRow(rowNumber, new RawImportRow.RawCell[] {firstName, lastName, birthDate, gender});
    }

    @SuppressWarnings("unchecked")
    private List<ImportRowError> errorsOf(Throwable t) {
        return ((RowValidationException) t).getErrors();
    }

    @Test
    void parse_validRow_returnsAllFields() {
        RawImportRow row = row(2, text("Lucía"), text("Pérez"), excelDate(LocalDate.of(2015, 3, 20)), text("F"));

        StudentImportRowParser.ParsedRow parsed = parser.parse(row);

        assertThat(parsed.firstName()).isEqualTo("Lucía");
        assertThat(parsed.lastName()).isEqualTo("Pérez");
        assertThat(parsed.birthDate()).isEqualTo(LocalDate.of(2015, 3, 20));
        assertThat(parsed.gender()).isEqualTo(Gender.F);
    }

    @Test
    void parse_missingFirstName_throwsWithFieldError() {
        RawImportRow row = row(2, text(""), text("Pérez"), excelDate(LocalDate.of(2015, 3, 20)), text("F"));

        assertThatThrownBy(() -> parser.parse(row))
                .isInstanceOf(RowValidationException.class)
                .satisfies(e -> {
                    List<ImportRowError> errors = errorsOf(e);
                    assertThat(errors).hasSize(1);
                    assertThat(errors.get(0).field()).isEqualTo("Nombres");
                    assertThat(errors.get(0).rowNumber()).isEqualTo(2);
                });
    }

    @Test
    void parse_missingLastName_throwsWithFieldError() {
        RawImportRow row = row(3, text("Lucía"), text("   "), excelDate(LocalDate.of(2015, 3, 20)), text("F"));

        assertThatThrownBy(() -> parser.parse(row))
                .isInstanceOf(RowValidationException.class)
                .satisfies(e -> {
                    List<ImportRowError> errors = errorsOf(e);
                    assertThat(errors).hasSize(1);
                    assertThat(errors.get(0).field()).isEqualTo("Apellidos");
                });
    }

    @Test
    void parse_excelDateCell_parsesCorrectly() {
        RawImportRow row = row(2, text("Ana"), text("Gómez"), excelDate(LocalDate.of(2010, 1, 15)), text("F"));

        StudentImportRowParser.ParsedRow parsed = parser.parse(row);

        assertThat(parsed.birthDate()).isEqualTo(LocalDate.of(2010, 1, 15));
    }

    @Test
    void parse_stringDateCell_parsesCorrectly() {
        RawImportRow row = row(2, text("Ana"), text("Gómez"), text("15/01/2010"), text("F"));

        StudentImportRowParser.ParsedRow parsed = parser.parse(row);

        assertThat(parsed.birthDate()).isEqualTo(LocalDate.of(2010, 1, 15));
    }

    @Test
    void parse_futureBirthDate_rejected() {
        RawImportRow row = row(2, text("Ana"), text("Gómez"), excelDate(LocalDate.now().plusDays(1)), text("F"));

        assertThatThrownBy(() -> parser.parse(row))
                .isInstanceOf(RowValidationException.class)
                .satisfies(e -> {
                    List<ImportRowError> errors = errorsOf(e);
                    assertThat(errors).anyMatch(err -> err.field().equals("Fecha de nacimiento"));
                });
    }

    @Test
    void parse_genderLowercaseM_normalized() {
        RawImportRow row = row(2, text("Juan"), text("Ramírez"), excelDate(LocalDate.of(2012, 5, 5)), text("m"));

        StudentImportRowParser.ParsedRow parsed = parser.parse(row);

        assertThat(parsed.gender()).isEqualTo(Gender.M);
    }

    @Test
    void parse_genderWithWhitespace_normalized() {
        RawImportRow row = row(2, text("Ana"), text("Ramírez"), excelDate(LocalDate.of(2012, 5, 5)), text(" F "));

        StudentImportRowParser.ParsedRow parsed = parser.parse(row);

        assertThat(parsed.gender()).isEqualTo(Gender.F);
    }

    @Test
    void parse_invalidGender_throws() {
        RawImportRow row = row(2, text("Ana"), text("Ramírez"), excelDate(LocalDate.of(2012, 5, 5)), text("X"));

        assertThatThrownBy(() -> parser.parse(row))
                .isInstanceOf(RowValidationException.class)
                .satisfies(e -> {
                    List<ImportRowError> errors = errorsOf(e);
                    assertThat(errors).hasSize(1);
                    assertThat(errors.get(0).field()).isEqualTo("Sexo (M/F)");
                });
    }

    @Test
    void parse_multipleProblems_collectsAllInOneException() {
        RawImportRow row = row(5, text(""), text(""), text("not-a-date"), text("X"));

        assertThatThrownBy(() -> parser.parse(row))
                .isInstanceOf(RowValidationException.class)
                .satisfies(e -> {
                    List<ImportRowError> errors = errorsOf(e);
                    assertThat(errors).hasSize(4);
                    assertThat(errors).allMatch(err -> err.rowNumber() == 5);
                });
    }
}
