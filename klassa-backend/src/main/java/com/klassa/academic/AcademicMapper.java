package com.klassa.academic;

import com.klassa.academic.dto.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface AcademicMapper {

    AcademicYearResponse toAcademicYearResponse(AcademicYear year);

    @Mapping(target = "gradeLevelId", source = "gradeLevel.id")
    @Mapping(target = "gradeLevelName", source = "gradeLevel.name")
    @Mapping(target = "academicYearId", source = "academicYear.id")
    @Mapping(target = "academicYearName", source = "academicYear.name")
    @Mapping(target = "homeroomTeacherId", source = "homeroomTeacher.id")
    @Mapping(target = "homeroomTeacherName",
             expression = "java(section.getHomeroomTeacher() != null ? section.getHomeroomTeacher().fullName() : null)")
    @Mapping(target = "activeEnrollments", ignore = true)
    SectionResponse toSectionResponse(Section section);

    @Mapping(target = "gradeLevelId", source = "gradeLevel.id")
    @Mapping(target = "gradeLevelName", ignore = true)
    @Mapping(target = "academicYearId", source = "academicYear.id")
    @Mapping(target = "academicYearName", source = "academicYear.name")
    @Mapping(target = "homeroomTeacherId", source = "homeroomTeacher.id")
    @Mapping(target = "homeroomTeacherName", ignore = true)
    @Mapping(target = "activeEnrollments", ignore = true)
    SectionResponse toSectionResponseSimple(Section section);

    @Mapping(target = "studentId", source = "student.id")
    @Mapping(target = "studentName", expression = "java(enrollment.getStudent().fullName())")
    @Mapping(target = "studentCode", source = "student.code")
    @Mapping(target = "sectionId", source = "section.id")
    @Mapping(target = "sectionName", source = "section.name")
    @Mapping(target = "guardianName",
             expression = "java(enrollment.getStudent().getFamily() != null ? enrollment.getStudent().getFamily().getGuardianName() : null)")
    @Mapping(target = "guardianPhone",
             expression = "java(enrollment.getStudent().getFamily() != null ? enrollment.getStudent().getFamily().getGuardianPhone() : null)")
    EnrollmentResponse toEnrollmentResponse(Enrollment enrollment);

    @Mapping(target = "subjectId", source = "subject.id")
    @Mapping(target = "subjectName", source = "subject.name")
    ScoreResponse toScoreResponse(Score score);

    @Mapping(target = "sectionId", source = "section.id")
    @Mapping(target = "sectionName", source = "section.name")
    @Mapping(target = "subjectId", source = "subject.id")
    @Mapping(target = "subjectName", source = "subject.name")
    @Mapping(target = "teacherId", source = "teacher.id")
    @Mapping(target = "teacherName", expression = "java(assignment.getTeacher().fullName())")
    TeachingAssignmentResponse toTeachingAssignmentResponse(TeachingAssignment assignment);
}
