package com.klassa.tenant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterTenantRequest(
        @NotBlank
        @Size(min = 3, max = 50)
        @Pattern(regexp = "^[a-z0-9-]+$", message = "Subdomain must be lowercase alphanumeric with hyphens")
        String subdomain,

        @NotBlank
        @Size(max = 200)
        String name,

        @NotNull
        Long planId,

        Integer trialDays,

        @NotBlank @Email
        String adminEmail,

        @NotBlank
        String adminFirstName,

        @NotBlank
        String adminLastName
) {}
