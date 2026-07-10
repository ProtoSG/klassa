package com.klassa.academic;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.academic.dto.ScoreRequest;
import com.klassa.academic.dto.ScoreResponse;
import com.klassa.shared.security.SecurityUser;
import com.klassa.user.UserRepository;
import com.klassa.user.UserRole;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ScoreService {

    private final ScoreRepository scoreRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final TeachingAssignmentRepository teachingAssignmentRepository;
    private final AcademicMapper academicMapper;

    public ScoreService(ScoreRepository scoreRepository,
                        EnrollmentRepository enrollmentRepository,
                        SubjectRepository subjectRepository,
                        UserRepository userRepository,
                        TeachingAssignmentRepository teachingAssignmentRepository,
                        AcademicMapper academicMapper) {
        this.scoreRepository = scoreRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.teachingAssignmentRepository = teachingAssignmentRepository;
        this.academicMapper = academicMapper;
    }

    @Transactional
    public ScoreResponse save(ScoreRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(request.enrollmentId())
                .orElseThrow(() -> new EntityNotFoundException("Enrollment", request.enrollmentId()));

        if (enrollment.getStatus() != EnrollmentStatus.ACTIVE) {
            throw new BusinessRuleException(ErrorCode.SCORE_INACTIVE_ENROLLMENT);
        }

        Subject subject = subjectRepository.findById(request.subjectId())
                .orElseThrow(() -> new EntityNotFoundException("Subject", request.subjectId()));

        SecurityUser principal = Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .map(auth -> (SecurityUser) auth.getPrincipal())
                .orElse(null);

        if (principal != null && principal.role() == UserRole.TEACHER
                && !teachingAssignmentRepository.existsBySectionIdAndSubjectIdAndTeacherId(
                        enrollment.getSection().getId(), subject.getId(), principal.userId())) {
            throw new AccessDeniedException("No estás asignado a esta materia en esta sección");
        }

        Score score = scoreRepository
                .findByEnrollmentIdAndSubjectIdAndPeriod(
                        request.enrollmentId(), request.subjectId(), request.period())
                .orElse(new Score());

        score.setEnrollment(enrollment);
        score.setSubject(subject);
        score.setPeriod(request.period());
        score.setScore(request.score());

        // Set createdBy from security context
        if (principal != null) {
            userRepository.findById(principal.userId()).ifPresent(score::setCreatedBy);
        }

        return academicMapper.toScoreResponse(scoreRepository.save(score));
    }

    public List<ScoreResponse> findByEnrollment(Long enrollmentId) {
        return scoreRepository.findAllByEnrollmentId(enrollmentId).stream()
                .map(academicMapper::toScoreResponse)
                .toList();
    }

    public List<ScoreResponse> findByEnrollmentAndPeriod(Long enrollmentId, Integer period) {
        return scoreRepository.findAllByEnrollmentIdAndPeriod(enrollmentId, period).stream()
                .map(academicMapper::toScoreResponse)
                .toList();
    }

    public BigDecimal getAverage(Long enrollmentId) {
        return scoreRepository.findAverageByEnrollmentId(enrollmentId)
                .orElse(BigDecimal.ZERO);
    }

    public BigDecimal getPeriodAverage(Long enrollmentId, Integer period) {
        return scoreRepository.findAverageByEnrollmentIdAndPeriod(enrollmentId, period)
                .orElse(BigDecimal.ZERO);
    }
}
