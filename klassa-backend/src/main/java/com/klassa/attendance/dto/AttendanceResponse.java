package com.klassa.attendance.dto;

import com.klassa.attendance.AttendanceStatus;

import java.time.LocalDate;

public record AttendanceResponse(
        Long id,
        Long enrollmentId,
        String studentName,
        LocalDate date,
        AttendanceStatus status,
        String note,
        Long registeredById
) {}
