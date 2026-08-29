package com.klassa.academic.dto;

import com.klassa.academic.CalendarEventType;

import java.time.LocalDate;

public record CalendarEventResponse(
        Long id,
        String title,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        CalendarEventType type
) {}
