package com.klassa.academic.dto;

import com.klassa.academic.GradeLevelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GradeLevelRequest(

        @NotBlank
        String name,

        @NotNull
        GradeLevelType level,

        Integer sortOrder
) {}
