package com.klassa.user.dto;

import com.klassa.user.UserRole;

public record UserResponse(
        Long id,
        String email,
        UserRole role,
        String firstName,
        String lastName,
        String fullName,
        Boolean active
) {}
