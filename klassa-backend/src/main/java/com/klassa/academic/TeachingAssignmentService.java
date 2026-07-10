package com.klassa.academic;

import com.klassa.academic.dto.TeachingAssignmentRequest;
import com.klassa.academic.dto.TeachingAssignmentResponse;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.user.User;
import com.klassa.user.UserRepository;
import com.klassa.user.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class TeachingAssignmentService {

    private final TeachingAssignmentRepository teachingAssignmentRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final AcademicMapper academicMapper;

    public TeachingAssignmentService(TeachingAssignmentRepository teachingAssignmentRepository,
                                     SectionRepository sectionRepository,
                                     SubjectRepository subjectRepository,
                                     UserRepository userRepository,
                                     AcademicMapper academicMapper) {
        this.teachingAssignmentRepository = teachingAssignmentRepository;
        this.sectionRepository = sectionRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.academicMapper = academicMapper;
    }

    @Transactional
    public TeachingAssignmentResponse assign(TeachingAssignmentRequest request) {
        Section section = sectionRepository.findById(request.sectionId())
                .orElseThrow(() -> new EntityNotFoundException("Section", request.sectionId()));
        Subject subject = subjectRepository.findById(request.subjectId())
                .orElseThrow(() -> new EntityNotFoundException("Subject", request.subjectId()));
        User teacher = userRepository.findById(request.teacherId())
                .orElseThrow(() -> new EntityNotFoundException("User", request.teacherId()));

        if (!subject.getGradeLevel().getId().equals(section.getGradeLevel().getId())) {
            throw new BusinessRuleException(ErrorCode.SUBJECT_GRADE_LEVEL_MISMATCH);
        }
        if (teacher.getRole() != UserRole.TEACHER) {
            throw new BusinessRuleException(ErrorCode.USER_NOT_TEACHER);
        }

        TeachingAssignment assignment = teachingAssignmentRepository
                .findBySectionIdAndSubjectId(request.sectionId(), request.subjectId())
                .orElseGet(TeachingAssignment::new);
        assignment.setSection(section);
        assignment.setSubject(subject);
        assignment.setTeacher(teacher);

        return academicMapper.toTeachingAssignmentResponse(teachingAssignmentRepository.save(assignment));
    }

    public List<TeachingAssignmentResponse> findBySection(Long sectionId) {
        return teachingAssignmentRepository.findAllBySectionId(sectionId).stream()
                .map(academicMapper::toTeachingAssignmentResponse)
                .toList();
    }

    @Transactional
    public void remove(Long id) {
        if (!teachingAssignmentRepository.existsById(id)) {
            throw new EntityNotFoundException("TeachingAssignment", id);
        }
        teachingAssignmentRepository.deleteById(id);
    }
}
