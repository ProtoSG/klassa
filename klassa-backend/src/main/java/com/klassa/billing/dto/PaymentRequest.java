package com.klassa.billing.dto;

import com.klassa.billing.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(

        @NotNull
        Long invoiceId,

        @NotNull
        @DecimalMin("0.01")
        BigDecimal amount,

        @NotNull
        @PastOrPresent
        LocalDate paymentDate,

        @NotNull
        PaymentMethod method,

        String receiptNumber,

        String notes
) {}
