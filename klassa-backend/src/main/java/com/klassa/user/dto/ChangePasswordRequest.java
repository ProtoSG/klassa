package com.klassa.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank @jakarta.validation.constraints.Email
        String email,

        @NotBlank
        String currentPassword,

        @NotBlank
        @Size(min = 8)
        String newPassword
) {}
