package com.klassa.tenant.dto;

public record TenantProvisionResponse(
        TenantResponse tenant,
        String tempPassword
) {}
