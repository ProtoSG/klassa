package com.klassa.academic;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.academic.dto.SectionRequest;
import com.klassa.academic.dto.SectionResponse;
import com.klassa.user.User;
import com.klassa.user.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SectionService {

    private final SectionRepository sectionRepository;
    private final GradeLevelRepository gradeLevelRepository;
    private final AcademicYearRepository academicYearRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AcademicMapper academicMapper;

    public SectionService(SectionRepository sectionRepository,
                          GradeLevelRepository gradeLevelRepository,
                          AcademicYearRepository academicYearRepository,
                          UserRepository userRepository,
                          EnrollmentRepository enrollmentRepository,
                          AcademicMapper academicMapper) {
        this.sectionRepository = sectionRepository;
        this.gradeLevelRepository = gradeLevelRepository;
        this.academicYearRepository = academicYearRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.academicMapper = academicMapper;
    }

    @Transactional
    public SectionResponse create(SectionRequest request) {
        Section section = buildSection(new Section(), request);
        return toResponseWithCount(sectionRepository.save(section));
    }

    public List<SectionResponse> findByAcademicYear(Long academicYearId) {
        return sectionRepository.findAllByAcademicYearId(academicYearId).stream()
                .map(this::toResponseWithCount)
                .toList();
    }

    public List<SectionResponse> findByAcademicYearAndHomeroomTeacher(Long academicYearId, Long teacherId) {
        return sectionRepository.findAllByAcademicYearIdAndHomeroomTeacherId(academicYearId, teacherId).stream()
                .map(this::toResponseWithCount)
                .toList();
    }

    public SectionResponse findById(Long id) {
        return sectionRepository.findById(id)
                .map(this::toResponseWithCount)
                .orElseThrow(() -> new EntityNotFoundException("Section", id));
    }

    @Transactional
    public SectionResponse update(Long id, SectionRequest request) {
        Section section = sectionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Section", id));
        long active = enrollmentRepository.countActiveBySectionId(id);
        Integer newCapacity = request.maxCapacity() != null ? request.maxCapacity() : section.getMaxCapacity();
        if (active > newCapacity) {
            throw new BusinessRuleException(ErrorCode.SECTION_CAPACITY_BELOW_ACTIVE, active);
        }
        return toResponseWithCount(sectionRepository.save(buildSection(section, request)));
    }

    private Section buildSection(Section section, SectionRequest request) {
        section.setName(request.name());
        section.setGradeLevel(gradeLevelRepository.findById(request.gradeLevelId())
                .orElseThrow(() -> new EntityNotFoundException("GradeLevel", request.gradeLevelId())));
        section.setAcademicYear(academicYearRepository.findById(request.academicYearId())
                .orElseThrow(() -> new EntityNotFoundException("AcademicYear", request.academicYearId())));
        if (request.homeroomTeacherId() != null) {
            User teacher = userRepository.findById(request.homeroomTeacherId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.homeroomTeacherId()));
            section.setHomeroomTeacher(teacher);
        }
        if (request.maxCapacity() != null) {
            section.setMaxCapacity(request.maxCapacity());
        }
        return section;
    }

    private SectionResponse toResponseWithCount(Section section) {
        long activeCount = enrollmentRepository.countActiveBySectionId(section.getId());
        SectionResponse base = academicMapper.toSectionResponse(section);
        return new SectionResponse(
                base.id(), base.name(), base.gradeLevelId(), base.gradeLevelName(),
                base.academicYearId(), base.academicYearName(),
                base.homeroomTeacherId(), base.homeroomTeacherName(),
                base.maxCapacity(), activeCount
        );
    }
}
