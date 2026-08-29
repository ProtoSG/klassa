package com.klassa.tenant.dto;

import com.klassa.tenant.TenantStatus;

import java.time.LocalDateTime;

public record TenantResponse(
        Long id,
        String subdomain,
        String name,
        TenantStatus status,
        Long planId,
        String planName,
        LocalDateTime trialEndsAt,
        LocalDateTime createdAt,
        LocalDateTime purgedAt
) {}
