package com.klassa.user.dto;

import com.klassa.user.UserRole;

public record LoginResponse(
        String email,
        String fullName,
        UserRole role,
        String tenantId
) {}
