package com.klassa.student;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.KlassaException;
import com.klassa.shared.storage.StorageService;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * Covers the two-phase import flow in {@link StudentService#importStudents}, added to close a
 * data-integrity gap called out in review: since every row is persisted through {@link
 * StudentImportService}'s own {@code REQUIRES_NEW} transaction (commits immediately, independent
 * of the rest of the file), checking the row-count cap only <em>while</em> streaming would let a
 * file that exceeds the cap still commit thousands of students before the cap trips -- leaving an
 * admin confused about why students exist despite an error saying the whole import failed. Phase
 * 1 ({@code reader.validate(file)}) must reject an oversized file before any row is parsed or
 * persisted.
 *
 * <p>Plain Mockito unit test (no Spring context) since {@link StudentService}'s collaborators are
 * all simple interfaces/beans -- no need for the overhead of a full application context just to
 * exercise this control flow.
 */
class StudentServiceImportTest {

    private static final List<String> HEADERS =
            List.of("Nombres", "Apellidos", "Fecha de nacimiento", "Sexo (M/F)");
    private static final int MAX_IMPORT_ROWS = 2000; // must track StudentService.MAX_IMPORT_ROWS

    private StudentImportService studentImportService;
    private StudentRepository studentRepository;
    private StudentService studentService;

    @BeforeEach
    void setUp() {
        studentRepository = mock(StudentRepository.class);
        FamilyRepository familyRepository = mock(FamilyRepository.class);
        StudentMapper studentMapper = mock(StudentMapper.class);
        StorageService storageService = mock(StorageService.class);
        StudentCodeGenerator studentCodeGenerator = mock(StudentCodeGenerator.class);
        studentImportService = mock(StudentImportService.class);
        studentService = new StudentService(studentRepository, familyRepository, studentMapper,
                storageService, studentCodeGenerator, studentImportService);
    }

    @Test
    void importStudents_fileExceedsRowCap_persistsNothing() throws Exception {
        byte[] bytes = buildWorkbook(MAX_IMPORT_ROWS + 5);
        MockMultipartFile file = new MockMultipartFile("file", "import.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);

        assertThatThrownBy(() -> studentService.importStudents(file))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((KlassaException) e).getCode())
                        .isEqualTo(ErrorCode.IMPORT_TOO_MANY_ROWS.name()));

        // The whole point of the two-phase fix: zero rows ever reach the per-row persistence path
        // when the file is rejected for exceeding the cap.
        verify(studentImportService, never()).importRow(any());
        verifyNoInteractions(studentRepository);
    }

    private byte[] buildWorkbook(int totalDataRows) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet();
            Row header = sheet.createRow(0);
            for (int c = 0; c < HEADERS.size(); c++) {
                header.createCell(c).setCellValue(HEADERS.get(c));
            }
            for (int r = 1; r <= totalDataRows; r++) {
                Row row = sheet.createRow(r);
                row.createCell(0).setCellValue("Nombre" + r);
                row.createCell(1).setCellValue("Apellido" + r);
                row.createCell(2).setCellValue("01/01/2015");
                row.createCell(3).setCellValue("F");
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
