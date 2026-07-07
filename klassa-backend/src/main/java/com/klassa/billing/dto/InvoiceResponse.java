package com.klassa.billing.dto;

import com.klassa.billing.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceResponse(
        Long id,
        String invoiceNumber,
        Long studentId,
        String studentName,
        Long feeScheduleId,
        String concept,
        BigDecimal amount,
        BigDecimal paidAmount,
        BigDecimal pendingAmount,
        LocalDate dueDate,
        InvoiceStatus status
) {}
