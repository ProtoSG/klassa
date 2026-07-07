package com.klassa.billing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceRequest(

        @NotNull
        Long studentId,

        Long feeScheduleId,

        @NotBlank
        String concept,

        @NotNull
        @DecimalMin("0.01")
        BigDecimal amount,

        @NotNull
        LocalDate dueDate
) {}
