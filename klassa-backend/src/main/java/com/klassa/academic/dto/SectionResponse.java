package com.klassa.academic.dto;

public record SectionResponse(
        Long id,
        String name,
        Long gradeLevelId,
        String gradeLevelName,
        Long academicYearId,
        String academicYearName,
        Long homeroomTeacherId,
        String homeroomTeacherName,
        Integer maxCapacity,
        Long activeEnrollments
) {}
