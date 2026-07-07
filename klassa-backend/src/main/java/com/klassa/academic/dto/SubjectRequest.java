package com.klassa.academic.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SubjectRequest(

        @NotBlank
        String name,

        @NotNull
        Long gradeLevelId,

        @Min(1)
        Integer hoursPerWeek
) {}
