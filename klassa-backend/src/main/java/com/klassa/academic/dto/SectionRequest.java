package com.klassa.academic.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SectionRequest(

        @NotBlank
        String name,

        @NotNull
        Long gradeLevelId,

        @NotNull
        Long academicYearId,

        Long homeroomTeacherId,

        @Min(1) @Max(100)
        Integer maxCapacity
) {}
