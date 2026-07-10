package com.klassa.academic.dto;

import com.klassa.academic.CalendarEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CalendarEventRequest(

        @NotBlank
        String title,

        String description,

        @NotNull
        LocalDate startDate,

        @NotNull
        LocalDate endDate,

        @NotNull
        CalendarEventType type
) {}
