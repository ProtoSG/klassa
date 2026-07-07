package com.klassa.billing.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record GenerateInvoicesRequest(

        @NotNull
        Long academicYearId,

        @NotNull
        Long feeScheduleId,

        @NotNull
        LocalDate dueDate
) {}
