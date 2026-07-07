package com.klassa.billing.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record FeeScheduleRequest(

        @NotBlank
        @Size(max = 200)
        String concept,

        @NotNull
        @DecimalMin("0.01")
        BigDecimal amount,

        @NotNull
        @Min(1) @Max(31)
        Integer dueDay,

        @NotNull
        Long academicYearId
) {}
