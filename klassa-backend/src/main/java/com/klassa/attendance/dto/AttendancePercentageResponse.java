package com.klassa.attendance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AttendancePercentageResponse(
        Long enrollmentId,
        LocalDate startDate,
        LocalDate endDate,
        long totalDays,
        long attendedDays,
        BigDecimal percentage
) {}
