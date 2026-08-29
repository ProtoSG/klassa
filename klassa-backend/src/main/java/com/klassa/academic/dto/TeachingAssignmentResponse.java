package com.klassa.academic.dto;

public record TeachingAssignmentResponse(
        Long id,
        Long sectionId,
        String sectionName,
        Long subjectId,
        String subjectName,
        Long teacherId,
        String teacherName
) {}
