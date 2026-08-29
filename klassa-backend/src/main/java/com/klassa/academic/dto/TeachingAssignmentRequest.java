package com.klassa.academic.dto;

import jakarta.validation.constraints.NotNull;

public record TeachingAssignmentRequest(

        @NotNull
        Long sectionId,

        @NotNull
        Long subjectId,

        @NotNull
        Long teacherId
) {}
