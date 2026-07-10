package com.klassa.attendance;

import com.klassa.academic.Enrollment;
import com.klassa.academic.EnrollmentRepository;
import com.klassa.attendance.dto.AttendancePercentageResponse;
import com.klassa.attendance.dto.AttendanceRequest;
import com.klassa.attendance.dto.AttendanceResponse;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.security.SecurityUser;
import com.klassa.user.UserRepository;
import com.klassa.user.UserRole;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final AttendanceMapper attendanceMapper;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             EnrollmentRepository enrollmentRepository,
                             UserRepository userRepository,
                             AttendanceMapper attendanceMapper) {
        this.attendanceRepository = attendanceRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.attendanceMapper = attendanceMapper;
    }

    @Transactional
    public AttendanceResponse register(AttendanceRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(request.enrollmentId())
                .orElseThrow(() -> new EntityNotFoundException("Enrollment", request.enrollmentId()));

        if (!enrollment.canRecordAttendance()) {
            throw new BusinessRuleException(ErrorCode.ATTENDANCE_INACTIVE_ENROLLMENT);
        }

        SecurityUser principal = Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .map(auth -> (SecurityUser) auth.getPrincipal())
                .orElse(null);

        if (principal != null && principal.role() == UserRole.TEACHER
                && !enrollmentRepository.existsByIdAndSectionHomeroomTeacherId(request.enrollmentId(), principal.userId())) {
            throw new AccessDeniedException("No eres el tutor de esta sección");
        }

        AttendanceRecord record = attendanceRepository
                .findByEnrollmentIdAndDate(request.enrollmentId(), request.date())
                .orElse(new AttendanceRecord());

        record.setEnrollment(enrollment);
        record.setDate(request.date());
        record.setStatus(request.status());
        record.setNote(request.note());

        if (principal != null) {
            userRepository.findById(principal.userId()).ifPresent(record::setRegisteredBy);
        }

        return attendanceMapper.toResponse(attendanceRepository.save(record));
    }

    public List<AttendanceResponse> findByEnrollment(Long enrollmentId) {
        return attendanceRepository.findAllByEnrollmentId(enrollmentId).stream()
                .map(attendanceMapper::toResponse)
                .toList();
    }

    public List<AttendanceResponse> findByEnrollmentAndRange(Long enrollmentId,
                                                              LocalDate start, LocalDate end) {
        return attendanceRepository.findAllByEnrollmentIdAndDateBetween(enrollmentId, start, end)
                .stream()
                .map(attendanceMapper::toResponse)
                .toList();
    }

    public List<AttendanceResponse> findBySectionAndDate(Long sectionId, LocalDate date) {
        return attendanceRepository.findBySectionAndDate(sectionId, date).stream()
                .map(attendanceMapper::toResponse)
                .toList();
    }

    public AttendancePercentageResponse getPercentage(Long enrollmentId,
                                                       LocalDate start, LocalDate end) {
        long total = attendanceRepository.countTotalDays(enrollmentId, start, end);
        long attended = attendanceRepository.countAttendedDays(enrollmentId, start, end);
        BigDecimal percentage = total == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(attended)
                        .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);
        return new AttendancePercentageResponse(enrollmentId, start, end, total, attended, percentage);
    }
}
