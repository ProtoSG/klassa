package com.klassa.assistant;

import com.klassa.academic.AcademicYearService;
import com.klassa.academic.CalendarEventRepository;
import com.klassa.academic.EnrollmentService;
import com.klassa.academic.ScoreService;
import com.klassa.academic.SectionService;
import com.klassa.academic.TeachingAssignmentService;
import com.klassa.academic.dto.AcademicYearResponse;
import com.klassa.academic.dto.CalendarEventResponse;
import com.klassa.academic.dto.EnrollmentResponse;
import com.klassa.academic.dto.SectionResponse;
import com.klassa.academic.dto.TeachingAssignmentResponse;
import com.klassa.attendance.AttendanceService;
import com.klassa.attendance.AttendanceStatus;
import com.klassa.attendance.dto.AttendancePercentageResponse;
import com.klassa.billing.InvoiceService;
import com.klassa.billing.InvoiceStatus;
import com.klassa.billing.dto.InvoiceResponse;
import com.klassa.shared.security.SecurityUser;
import com.klassa.shared.web.PageResponse;
import com.klassa.student.StudentService;
import com.klassa.student.StudentStatus;
import com.klassa.student.dto.StudentResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only tools the AI assistant can call. This is the crux of the feature's security design:
 * every method below carries the <b>exact same {@code @PreAuthorize} SpEL already enforced by the
 * matching REST controller endpoint</b>, copied verbatim (only the SpEL's path-variable reference
 * is renamed to match this method's own parameter name — Spring resolves {@code #paramName} via
 * compiled parameter names, confirmed enabled for this build via the Spring Boot parent POM's
 * {@code -parameters} javac flag).
 * <p>
 * This only works because the bean is genuinely Spring-managed and always invoked through the
 * injected proxy (see {@link AssistantToolDispatcher}) — calling these methods via {@code this}
 * from within the same class, or via a plain {@code new AssistantTools(...)}, would silently skip
 * the {@code @PreAuthorize} AOP interceptor entirely.
 */
@Component
public class AssistantTools {

    private static final int ATTENDANCE_LOOKBACK_DAYS = 30;
    private static final int MY_STUDENTS_PAGE_SIZE = 100;
    private static final int INVOICES_PAGE_SIZE = 20;

    private final StudentService studentService;
    private final ScoreService scoreService;
    private final AttendanceService attendanceService;
    private final InvoiceService invoiceService;
    private final SectionService sectionService;
    private final EnrollmentService enrollmentService;
    private final TeachingAssignmentService teachingAssignmentService;
    private final AcademicYearService academicYearService;
    private final CalendarEventRepository calendarEventRepository;

    public AssistantTools(StudentService studentService, ScoreService scoreService,
                          AttendanceService attendanceService, InvoiceService invoiceService,
                          SectionService sectionService, EnrollmentService enrollmentService,
                          TeachingAssignmentService teachingAssignmentService,
                          AcademicYearService academicYearService,
                          CalendarEventRepository calendarEventRepository) {
        this.studentService = studentService;
        this.scoreService = scoreService;
        this.attendanceService = attendanceService;
        this.invoiceService = invoiceService;
        this.sectionService = sectionService;
        this.enrollmentService = enrollmentService;
        this.teachingAssignmentService = teachingAssignmentService;
        this.academicYearService = academicYearService;
        this.calendarEventRepository = calendarEventRepository;
    }

    // ─── Existing tools ────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or hasRole('TREASURER') "
            + "or (hasRole('TEACHER') and @academicSecurity.teachesStudent(#studentId, authentication.principal.userId)) "
            + "or (hasRole('PARENT') and @familySecurity.ownsStudent(#studentId, authentication.principal.userId))")
    public Map<String, Object> getStudentInfo(Long studentId) {
        StudentResponse student = studentService.findById(studentId);
        Map<String, Object> result = new HashMap<>();
        result.put("id", student.id());
        result.put("code", student.code());
        result.put("fullName", student.fullName());
        result.put("birthDate", student.birthDate());
        result.put("gender", student.gender());
        result.put("status", student.status());
        result.put("familyId", student.familyId());
        result.put("guardianName", student.guardianName());
        return result;
    }

    @PreAuthorize("hasRole('ADMIN') "
            + "or (hasRole('TEACHER') and (@academicSecurity.ownsEnrollment(#enrollmentId, authentication.principal.userId) "
            + "or @academicSecurity.teachesInEnrollmentSection(#enrollmentId, authentication.principal.userId))) "
            + "or (hasRole('PARENT') and @familySecurity.ownsEnrollment(#enrollmentId, authentication.principal.userId))")
    public Map<String, Object> getStudentGrades(Long enrollmentId) {
        List<Map<String, Object>> scores = scoreService.findByEnrollment(enrollmentId).stream()
                .map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("subject", s.subjectName());
                    m.put("period", s.period());
                    m.put("score", s.score());
                    return m;
                })
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("enrollmentId", enrollmentId);
        result.put("average", scoreService.getAverage(enrollmentId));
        result.put("scores", scores);
        return result;
    }

    @PreAuthorize("hasRole('ADMIN') "
            + "or (hasRole('TEACHER') and @academicSecurity.ownsEnrollment(#enrollmentId, authentication.principal.userId)) "
            + "or (hasRole('PARENT') and @familySecurity.ownsEnrollment(#enrollmentId, authentication.principal.userId))")
    public Map<String, Object> getStudentAttendance(Long enrollmentId) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(ATTENDANCE_LOOKBACK_DAYS);

        AttendancePercentageResponse percentage = attendanceService.getPercentage(enrollmentId, start, end);
        List<Map<String, Object>> notablyAbsent = attendanceService.findByEnrollmentAndRange(enrollmentId, start, end)
                .stream()
                .filter(a -> a.status() != AttendanceStatus.PRESENT)
                .map(a -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("date", a.date());
                    m.put("status", a.status());
                    return m;
                })
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("enrollmentId", enrollmentId);
        result.put("periodStart", start);
        result.put("periodEnd", end);
        result.put("totalDays", percentage.totalDays());
        result.put("attendedDays", percentage.attendedDays());
        result.put("percentage", percentage.percentage());
        result.put("absencesOrLatesInPeriod", notablyAbsent);
        return result;
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('TREASURER') "
            + "or (hasRole('PARENT') and @familySecurity.ownsStudent(#studentId, authentication.principal.userId))")
    public Map<String, Object> getStudentBalance(Long studentId) {
        BigDecimal pendingBalance = invoiceService.getPendingBalance(studentId);
        Map<String, Object> result = new HashMap<>();
        result.put("studentId", studentId);
        result.put("pendingBalance", pendingBalance);
        return result;
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('TREASURER')")
    public List<Map<String, Object>> listMyStudents(SecurityUser principal) {
        var page = studentService.search(StudentStatus.ACTIVE, null, principal,
                PageRequest.of(0, MY_STUDENTS_PAGE_SIZE, Sort.by("id")));
        return page.content().stream()
                .map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", s.id());
                    m.put("code", s.code());
                    m.put("fullName", s.fullName());
                    m.put("status", s.status());
                    return m;
                })
                .toList();
    }

    // ─── New tools ─────────────────────────────────────────────────────────────

    // Copied verbatim from SectionController#findByAcademicYear (#academicYearId already matches).
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public List<Map<String, Object>> listSections(Long academicYearId, SecurityUser principal) {
        List<SectionResponse> sections = sectionService.findByAcademicYear(academicYearId);
        return sections.stream()
                .map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", s.id());
                    m.put("name", s.name());
                    m.put("gradeLevelName", s.gradeLevelName());
                    m.put("homeroomTeacherName", s.homeroomTeacherName());
                    m.put("maxCapacity", s.maxCapacity());
                    m.put("activeEnrollments", s.activeEnrollments());
                    return m;
                })
                .toList();
    }

    // Copied verbatim from EnrollmentController#findBySection (#sectionId already matches).
    @PreAuthorize("hasRole('ADMIN') "
            + "or (hasRole('TEACHER') and @academicSecurity.ownsSection(#sectionId, authentication.principal.userId))")
    public List<Map<String, Object>> listSectionEnrollments(Long sectionId) {
        return enrollmentService.findBySection(sectionId).stream()
                .map(this::enrollmentToMap)
                .toList();
    }

    // Copied verbatim from EnrollmentController#findByStudent (#studentId already matches).
    @PreAuthorize("hasRole('ADMIN') "
            + "or (hasRole('TEACHER') and @academicSecurity.teachesStudent(#studentId, authentication.principal.userId)) "
            + "or (hasRole('PARENT') and @familySecurity.ownsStudent(#studentId, authentication.principal.userId))")
    public List<Map<String, Object>> listStudentEnrollments(Long studentId) {
        return enrollmentService.findByStudent(studentId).stream()
                .map(this::enrollmentToMap)
                .toList();
    }

    // Copied verbatim from TeachingAssignmentController#findBySection (#sectionId already matches).
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public List<Map<String, Object>> listSectionAssignments(Long sectionId) {
        return teachingAssignmentService.findBySection(sectionId).stream()
                .map(a -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", a.id());
                    m.put("subjectName", a.subjectName());
                    m.put("teacherName", a.teacherName());
                    return m;
                })
                .toList();
    }

    // Copied verbatim from BillingController.OWNS_STUDENT_BILLING (#studentId already matches).
    @PreAuthorize("hasRole('ADMIN') or hasRole('TREASURER') "
            + "or (hasRole('PARENT') and @familySecurity.ownsStudent(#studentId, authentication.principal.userId))")
    public Map<String, Object> listStudentInvoices(Long studentId) {
        PageResponse<InvoiceResponse> page = invoiceService.findByStudentPaged(studentId,
                PageRequest.of(0, INVOICES_PAGE_SIZE, Sort.by("dueDate").descending()));
        List<Map<String, Object>> invoices = page.content().stream()
                .map(inv -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", inv.id());
                    m.put("invoiceNumber", inv.invoiceNumber());
                    m.put("concept", inv.concept());
                    m.put("amount", inv.amount());
                    m.put("paidAmount", inv.paidAmount());
                    m.put("pendingAmount", inv.pendingAmount());
                    m.put("dueDate", inv.dueDate());
                    m.put("status", inv.status());
                    return m;
                })
                .toList();
        Map<String, Object> result = new HashMap<>();
        result.put("studentId", studentId);
        result.put("invoices", invoices);
        result.put("totalPages", page.totalPages());
        return result;
    }

    // Copied verbatim from CalendarEventController#findAll — all four tenant roles can read.
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('TREASURER') or hasRole('PARENT')")
    public List<Map<String, Object>> listCalendarEvents() {
        return calendarEventRepository.findAllByOrderByStartDateAsc().stream()
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", e.getId());
                    m.put("title", e.getTitle());
                    m.put("description", e.getDescription());
                    m.put("startDate", e.getStartDate());
                    m.put("endDate", e.getEndDate());
                    m.put("type", e.getType());
                    return m;
                })
                .toList();
    }

    // Copied verbatim from AcademicYearController#findAll (#academicYearId not needed).
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('TREASURER')")
    public List<Map<String, Object>> listAcademicYears() {
        return academicYearService.findAll().stream()
                .map(y -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", y.id());
                    m.put("name", y.name());
                    m.put("startDate", y.startDate());
                    m.put("endDate", y.endDate());
                    m.put("active", y.active());
                    return m;
                })
                .toList();
    }

    private Map<String, Object> enrollmentToMap(EnrollmentResponse e) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", e.id());
        m.put("studentName", e.studentName());
        m.put("studentCode", e.studentCode());
        m.put("sectionName", e.sectionName());
        m.put("enrolledAt", e.enrolledAt());
        m.put("status", e.status());
        return m;
    }
}
