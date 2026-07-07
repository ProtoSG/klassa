package com.klassa.billing.dto;

import java.math.BigDecimal;

public record FeeScheduleResponse(
        Long id,
        String concept,
        BigDecimal amount,
        Integer dueDay,
        Long academicYearId,
        String academicYearName,
        Boolean active
) {}
