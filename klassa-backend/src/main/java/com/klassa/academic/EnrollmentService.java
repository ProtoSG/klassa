package com.klassa.academic;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.academic.dto.EnrollmentRequest;
import com.klassa.academic.dto.EnrollmentResponse;
import com.klassa.student.Student;
import com.klassa.student.StudentRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final SectionRepository sectionRepository;
    private final StudentRepository studentRepository;
    private final AcademicMapper academicMapper;
    private final JdbcTemplate jdbcTemplate;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             SectionRepository sectionRepository,
                             StudentRepository studentRepository,
                             AcademicMapper academicMapper,
                             JdbcTemplate jdbcTemplate) {
        this.enrollmentRepository = enrollmentRepository;
        this.sectionRepository = sectionRepository;
        this.studentRepository = studentRepository;
        this.academicMapper = academicMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public EnrollmentResponse enroll(EnrollmentRequest request) {
        Student student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> new EntityNotFoundException("Student", request.studentId()));

        // Pessimistic lock: serialise concurrent enrollments on this section so the
        // capacity check-then-insert below is atomic and can't exceed max_capacity.
        Section section = sectionRepository.findByIdForUpdate(request.sectionId())
                .orElseThrow(() -> new EntityNotFoundException("Section", request.sectionId()));

        long activeCount = enrollmentRepository.countActiveBySectionId(request.sectionId());
        section.assertHasCapacity((int) activeCount);

        var existing = enrollmentRepository.findByStudentIdAndSectionId(request.studentId(), request.sectionId());
        if (existing.isPresent() && existing.get().getStatus() == EnrollmentStatus.ACTIVE) {
            throw new BusinessRuleException(ErrorCode.ALREADY_ENROLLED);
        }
        Enrollment enrollment = existing.orElseGet(Enrollment::new);

        // Re-enrolling a previously withdrawn/transferred student reactivates the existing row
        // instead of inserting a new one — a second row for the same (student, section) pair
        // would violate the uq_enrollments_student_section constraint.
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        enrollment.setEnrolledAt(LocalDateTime.now());
        return academicMapper.toEnrollmentResponse(enrollmentRepository.save(enrollment));
    }

    public List<EnrollmentResponse> findBySection(Long sectionId) {
        return enrollmentRepository.findAllBySectionId(sectionId).stream()
                .map(academicMapper::toEnrollmentResponse)
                .toList();
    }

    public List<EnrollmentResponse> findByStudent(Long studentId) {
        return enrollmentRepository.findAllByStudentId(studentId).stream()
                .map(academicMapper::toEnrollmentResponse)
                .toList();
    }

    @Transactional
    public EnrollmentResponse transfer(Long enrollmentId, Long newSectionId, String performedBy) {
        jdbcTemplate.update("CALL sp_transfer_student(?, ?, ?)", enrollmentId, newSectionId, performedBy);
        // Return the new active enrollment
        return enrollmentRepository.findAllBySectionIdAndStatus(newSectionId, EnrollmentStatus.ACTIVE)
                .stream()
                .reduce((a, b) -> b) // last inserted
                .map(academicMapper::toEnrollmentResponse)
                .orElseThrow(() -> new EntityNotFoundException("Enrollment", enrollmentId));
    }

    @Transactional
    public EnrollmentResponse withdraw(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new EntityNotFoundException("Enrollment", enrollmentId));
        enrollment.withdraw();
        return academicMapper.toEnrollmentResponse(enrollmentRepository.save(enrollment));
    }
}
