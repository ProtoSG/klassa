package com.klassa.tenant.dto;

import java.math.BigDecimal;
import java.util.Map;

public record PlanResponse(
        Long id,
        String name,
        Integer maxStudents,
        BigDecimal priceMonthly,
        Map<String, Object> features,
        Boolean active
) {}
