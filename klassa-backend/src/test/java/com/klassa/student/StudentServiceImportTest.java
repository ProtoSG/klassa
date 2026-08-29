package com.klassa.student;

import com.klassa.plan.PlanFeatures;
import com.klassa.plan.PlanService;
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
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

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
    private PlanService planService;
    private StudentService studentService;

    @BeforeEach
    void setUp() {
        studentRepository = mock(StudentRepository.class);
        FamilyRepository familyRepository = mock(FamilyRepository.class);
        StudentMapper studentMapper = mock(StudentMapper.class);
        StorageService storageService = mock(StorageService.class);
        StudentCodeGenerator studentCodeGenerator = mock(StudentCodeGenerator.class);
        studentImportService = mock(StudentImportService.class);
        planService = mock(PlanService.class);
        // Default to "unlimited" so the existing tests don't have to opt out of the cap check.
        when(planService.getCurrentFeatures()).thenReturn(
                new PlanFeatures(Set.of("students"), 9999, 0));
        studentService = new StudentService(studentRepository, familyRepository, studentMapper,
                storageService, studentCodeGenerator, studentImportService, planService);
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
        // when the file is rejected for exceeding the cap. The plan cap check legitimately reads
        // countByStatus(ACTIVE) before the row-count check rejects the file, so we only verify
        // the per-row path was never entered.
        verify(studentImportService, never()).importRow(any());
    }

    @Test
    void importStudents_tenantAtPlanCap_rejectsBeforeAnyRowPersists() throws Exception {
        // Override the default unlimited plan with a tiny Starter cap.
        when(planService.getCurrentFeatures()).thenReturn(
                new PlanFeatures(Set.of("students"), 100, 0));
        when(studentRepository.countByStatus(StudentStatus.ACTIVE)).thenReturn(100L);

        byte[] bytes = buildWorkbook(5);
        MockMultipartFile file = new MockMultipartFile("file", "import.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);

        assertThatThrownBy(() -> studentService.importStudents(file))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((KlassaException) e).getCode())
                        .isEqualTo(ErrorCode.STUDENT_LIMIT_REACHED.name()));

        // Cap check must be upfront — zero rows committed, even though the file itself is valid.
        verify(studentImportService, never()).importRow(any());
    }

    @Test
    void importStudents_tenantUnderCap_proceedsNormally() throws Exception {
        when(planService.getCurrentFeatures()).thenReturn(
                new PlanFeatures(Set.of("students"), 100, 0));
        when(studentRepository.countByStatus(StudentStatus.ACTIVE)).thenReturn(50L);

        byte[] bytes = buildWorkbook(3);
        MockMultipartFile file = new MockMultipartFile("file", "import.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);

        // Sanity: the cap check passes, so the import reaches the per-row path.
        // (Sheet construction succeeds; downstream StudentImportService is mocked and lets
        // importRow be called freely.)
        try {
            studentService.importStudents(file);
        } catch (Exception ignored) {
            // We don't care about the final response here — only that we crossed the cap check.
        }
        verify(studentImportService, atLeastOnce()).importRow(any());
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
