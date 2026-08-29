package com.klassa.academic.security;

import com.klassa.academic.EnrollmentRepository;
import com.klassa.academic.SectionRepository;
import com.klassa.academic.TeachingAssignmentRepository;
import org.springframework.stereotype.Component;

@Component("academicSecurity")
public class AcademicSecurity {

    private final SectionRepository sectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TeachingAssignmentRepository teachingAssignmentRepository;

    public AcademicSecurity(SectionRepository sectionRepository, EnrollmentRepository enrollmentRepository,
                            TeachingAssignmentRepository teachingAssignmentRepository) {
        this.sectionRepository = sectionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.teachingAssignmentRepository = teachingAssignmentRepository;
    }

    public boolean ownsSection(Long sectionId, Long teacherId) {
        return sectionRepository.existsByIdAndHomeroomTeacherId(sectionId, teacherId);
    }

    public boolean ownsEnrollment(Long enrollmentId, Long teacherId) {
        return enrollmentRepository.existsByIdAndSectionHomeroomTeacherId(enrollmentId, teacherId);
    }

    // Section-level check (any assigned subject, not just homeroom) — used by ScoreController
    // reads only. Attendance/Enrollment endpoints stay on ownsEnrollment/ownsSection (homeroom-only).
    public boolean teachesInEnrollmentSection(Long enrollmentId, Long teacherId) {
        return teachingAssignmentRepository.existsByEnrollmentSectionAndTeacherId(enrollmentId, teacherId);
    }

    // Is this teacher the homeroom tutor or a subject teacher for ANY of this student's active
    // sections — used to scope Student reads for TEACHER (roster is limited to their own students).
    public boolean teachesStudent(Long studentId, Long teacherId) {
        return enrollmentRepository.existsActiveEnrollmentForStudentAndTeacher(studentId, teacherId);
    }
}
