package com.klassa.academic.dto;

import jakarta.validation.constraints.NotNull;

public record EnrollmentRequest(

        @NotNull
        Long studentId,

        @NotNull
        Long sectionId
) {}
