package com.klassa.attendance.dto;

import com.klassa.attendance.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;

public record AttendanceRequest(

        @NotNull
        Long enrollmentId,

        @NotNull
        @PastOrPresent
        LocalDate date,

        @NotNull
        AttendanceStatus status,

        String note
) {}
