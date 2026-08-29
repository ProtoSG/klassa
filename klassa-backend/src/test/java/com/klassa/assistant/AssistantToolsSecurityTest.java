package com.klassa.assistant;

import com.klassa.academic.AcademicYearService;
import com.klassa.academic.CalendarEventRepository;
import com.klassa.academic.EnrollmentRepository;
import com.klassa.academic.EnrollmentService;
import com.klassa.academic.ScoreService;
import com.klassa.academic.SectionRepository;
import com.klassa.academic.SectionService;
import com.klassa.academic.TeachingAssignmentRepository;
import com.klassa.academic.TeachingAssignmentService;
import com.klassa.academic.security.AcademicSecurity;
import com.klassa.attendance.AttendanceService;
import com.klassa.billing.InvoiceRepository;
import com.klassa.billing.InvoiceService;
import com.klassa.shared.security.SecurityUser;
import com.klassa.student.FamilyRepository;
import com.klassa.student.Gender;
import com.klassa.student.StudentRepository;
import com.klassa.student.StudentService;
import com.klassa.student.StudentStatus;
import com.klassa.student.dto.StudentResponse;
import com.klassa.student.security.FamilySecurity;
import com.klassa.user.UserRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Proves that AssistantTools' copied {@code @PreAuthorize} SpEL actually fires when the bean is
 * invoked through the Spring proxy (the same path {@link AssistantToolDispatcher} uses) — not
 * just from a real HTTP request through the equivalent REST controller. This is the single most
 * important correctness property of the whole assistant feature: if this test suite is green but
 * the enforcement is actually a no-op (e.g. because someone starts calling the bean via {@code new
 * AssistantTools(...)} or {@code this.method(...)} from inside AssistantTools), these tests would
 * fail to throw and catch it.
 * <p>
 * There is no existing precedent in this codebase for testing {@code @PreAuthorize} enforcement
 * (grepped for {@code @WithMockUser} / {@code @EnableMethodSecurity} / a Spring-context security
 * test — none exist; every other test here is a plain Mockito unit test or a domain-entity test).
 * This test builds the smallest possible real Spring context that reproduces the production setup
 * genuinely enough to exercise the AOP method-security interceptor: {@code @EnableMethodSecurity}
 * plus the real {@code AssistantTools}, {@code AcademicSecurity}, and {@code FamilySecurity} beans
 * (registered under the same {@code "academicSecurity"} / {@code "familySecurity"} bean names the
 * SpEL references), wired to Mockito-mocked repositories/services rather than a real database.
 */
@SpringJUnitConfig(AssistantToolsSecurityTest.Config.class)
class AssistantToolsSecurityTest {

    @Configuration
    @EnableMethodSecurity
    static class Config {

        @Bean
        SectionRepository sectionRepository() {
            return mock(SectionRepository.class);
        }

        @Bean
        EnrollmentRepository enrollmentRepository() {
            return mock(EnrollmentRepository.class);
        }

        @Bean
        TeachingAssignmentRepository teachingAssignmentRepository() {
            return mock(TeachingAssignmentRepository.class);
        }

        @Bean
        FamilyRepository familyRepository() {
            return mock(FamilyRepository.class);
        }

        @Bean
        StudentRepository studentRepository() {
            return mock(StudentRepository.class);
        }

        @Bean
        InvoiceRepository invoiceRepository() {
            return mock(InvoiceRepository.class);
        }

        @Bean("academicSecurity")
        AcademicSecurity academicSecurity(SectionRepository sectionRepository,
                                          EnrollmentRepository enrollmentRepository,
                                          TeachingAssignmentRepository teachingAssignmentRepository) {
            return new AcademicSecurity(sectionRepository, enrollmentRepository, teachingAssignmentRepository);
        }

        @Bean("familySecurity")
        FamilySecurity familySecurity(FamilyRepository familyRepository, StudentRepository studentRepository,
                                      EnrollmentRepository enrollmentRepository, InvoiceRepository invoiceRepository) {
            return new FamilySecurity(familyRepository, studentRepository, enrollmentRepository, invoiceRepository);
        }

        @Bean
        StudentService studentService() {
            return mock(StudentService.class);
        }

        @Bean
        ScoreService scoreService() {
            return mock(ScoreService.class);
        }

        @Bean
        AttendanceService attendanceService() {
            return mock(AttendanceService.class);
        }

        @Bean
        InvoiceService invoiceService() {
            return mock(InvoiceService.class);
        }

        @Bean
        SectionService sectionService() {
            return mock(SectionService.class);
        }

        @Bean
        EnrollmentService enrollmentService() {
            return mock(EnrollmentService.class);
        }

        @Bean
        TeachingAssignmentService teachingAssignmentService() {
            return mock(TeachingAssignmentService.class);
        }

        @Bean
        AcademicYearService academicYearService() {
            return mock(AcademicYearService.class);
        }

        @Bean
        CalendarEventRepository calendarEventRepository() {
            return mock(CalendarEventRepository.class);
        }

        @Bean
        AssistantTools assistantTools(StudentService studentService, ScoreService scoreService,
                                      AttendanceService attendanceService, InvoiceService invoiceService,
                                      SectionService sectionService, EnrollmentService enrollmentService,
                                      TeachingAssignmentService teachingAssignmentService,
                                      AcademicYearService academicYearService,
                                      CalendarEventRepository calendarEventRepository) {
            return new AssistantTools(studentService, scoreService, attendanceService, invoiceService,
                    sectionService, enrollmentService, teachingAssignmentService,
                    academicYearService, calendarEventRepository);
        }
    }

    @Autowired
    private AssistantTools assistantTools;
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    @Autowired
    private TeachingAssignmentRepository teachingAssignmentRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private StudentService studentService;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(UserRole role, Long userId) {
        SecurityUser user = new SecurityUser(userId, "user@colegio1.com", "colegio1", role);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    }

    // ── getStudentInfo — copied from StudentController#findById ───────────────────────────────

    @Test
    void getStudentInfo_teacherNotTeachingStudent_isDenied() {
        authenticateAs(UserRole.TEACHER, 42L);
        when(enrollmentRepository.existsActiveEnrollmentForStudentAndTeacher(99L, 42L)).thenReturn(false);

        assertThatThrownBy(() -> assistantTools.getStudentInfo(99L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getStudentInfo_parentNotOwningStudent_isDenied() {
        authenticateAs(UserRole.PARENT, 7L);
        when(studentRepository.existsByIdAndFamilyGuardianUserId(99L, 7L)).thenReturn(false);

        assertThatThrownBy(() -> assistantTools.getStudentInfo(99L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getStudentInfo_admin_isAllowed() {
        authenticateAs(UserRole.ADMIN, 1L);
        when(studentService.findById(99L)).thenReturn(new StudentResponse(
                99L, "2026-001", "Ana", "Perez", "Ana Perez",
                java.time.LocalDate.of(2015, 1, 1), Gender.F, StudentStatus.ACTIVE, 5L,
                "Juan Perez", null, null));

        assertThatCode(() -> assistantTools.getStudentInfo(99L)).doesNotThrowAnyException();
    }

    // ── getStudentGrades — copied from ScoreController.CAN_VIEW_SCORES ────────────────────────

    @Test
    void getStudentGrades_teacherNeitherOwningNorTeachingSection_isDenied() {
        authenticateAs(UserRole.TEACHER, 42L);
        when(enrollmentRepository.existsByIdAndSectionHomeroomTeacherId(55L, 42L)).thenReturn(false);
        when(teachingAssignmentRepository.existsByEnrollmentSectionAndTeacherId(55L, 42L)).thenReturn(false);

        assertThatThrownBy(() -> assistantTools.getStudentGrades(55L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getStudentGrades_parentNotOwningEnrollment_isDenied() {
        authenticateAs(UserRole.PARENT, 7L);
        when(enrollmentRepository.existsByIdAndStudentFamilyGuardianUserId(55L, 7L)).thenReturn(false);

        assertThatThrownBy(() -> assistantTools.getStudentGrades(55L))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── getStudentAttendance — copied from AttendanceController.OWNS_ENROLLMENT ────────────────

    @Test
    void getStudentAttendance_teacherNotHomeroomOfSection_isDenied() {
        authenticateAs(UserRole.TEACHER, 42L);
        when(enrollmentRepository.existsByIdAndSectionHomeroomTeacherId(55L, 42L)).thenReturn(false);

        assertThatThrownBy(() -> assistantTools.getStudentAttendance(55L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getStudentAttendance_parentNotOwningEnrollment_isDenied() {
        authenticateAs(UserRole.PARENT, 7L);
        when(enrollmentRepository.existsByIdAndStudentFamilyGuardianUserId(55L, 7L)).thenReturn(false);

        assertThatThrownBy(() -> assistantTools.getStudentAttendance(55L))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── getStudentBalance — copied from BillingController.OWNS_STUDENT_BILLING ────────────────
    // (no TEACHER branch at all — billing is never teacher-visible, so any TEACHER is denied
    // outright, without needing a mock to return false.)

    @Test
    void getStudentBalance_teacher_isAlwaysDenied() {
        authenticateAs(UserRole.TEACHER, 42L);

        assertThatThrownBy(() -> assistantTools.getStudentBalance(99L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getStudentBalance_parentNotOwningStudent_isDenied() {
        authenticateAs(UserRole.PARENT, 7L);
        // OWNS_STUDENT_BILLING calls familySecurity.ownsStudent -> studentRepository, not invoiceRepository.
        when(studentRepository.existsByIdAndFamilyGuardianUserId(99L, 7L)).thenReturn(false);

        assertThatThrownBy(() -> assistantTools.getStudentBalance(99L))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── listMyStudents — deliberately stricter than the plan's literal spec ────────────────────
    // See the comment on AssistantTools#listMyStudents: StudentService.search does NOT scope
    // PARENT to their own kids (only TEACHER gets scoped; ADMIN/TREASURER/PARENT would all get
    // the full unscoped roster), so this tool copies StudentController#findAll's own role gate
    // (ADMIN/TEACHER/TREASURER only) instead of leaving it open to PARENT as the plan suggested.

    @Test
    void listMyStudents_parent_isDenied() {
        authenticateAs(UserRole.PARENT, 7L);

        assertThatThrownBy(() -> assistantTools.listMyStudents(
                new SecurityUser(7L, "user@colegio1.com", "colegio1", UserRole.PARENT)))
                .isInstanceOf(AccessDeniedException.class);
    }
}
