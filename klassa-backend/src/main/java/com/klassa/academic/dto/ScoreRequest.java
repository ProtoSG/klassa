package com.klassa.academic.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ScoreRequest(

        @NotNull
        Long enrollmentId,

        @NotNull
        Long subjectId,

        @NotNull
        @Min(1) @Max(4)
        Integer period,

        @NotNull
        @DecimalMin("0.00") @DecimalMax("20.00")
        BigDecimal score
) {}
