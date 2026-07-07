package com.klassa.academic.dto;

public record SubjectResponse(
        Long id,
        String name,
        Long gradeLevelId,
        String gradeLevelName,
        Integer hoursPerWeek,
        Boolean active
) {}
