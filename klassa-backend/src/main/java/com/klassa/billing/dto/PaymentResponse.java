package com.klassa.billing.dto;

import com.klassa.billing.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentResponse(
        Long id,
        Long invoiceId,
        String invoiceNumber,
        BigDecimal amount,
        LocalDate paymentDate,
        PaymentMethod method,
        String receiptNumber,
        String notes,
        Long registeredById
) {}
