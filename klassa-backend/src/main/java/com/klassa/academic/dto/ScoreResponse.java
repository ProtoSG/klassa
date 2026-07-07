package com.klassa.academic.dto;

import java.math.BigDecimal;

public record ScoreResponse(
        Long id,
        Long enrollmentId,
        Long subjectId,
        String subjectName,
        Integer period,
        BigDecimal score
) {}
