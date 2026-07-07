package com.klassa.academic.dto;

import java.time.LocalDate;

public record AcademicYearResponse(
        Long id,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        Boolean active
) {}
