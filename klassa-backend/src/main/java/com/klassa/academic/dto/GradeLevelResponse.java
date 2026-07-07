package com.klassa.academic.dto;

import com.klassa.academic.GradeLevelType;

public record GradeLevelResponse(
        Long id,
        String name,
        GradeLevelType level,
        Integer sortOrder
) {}
