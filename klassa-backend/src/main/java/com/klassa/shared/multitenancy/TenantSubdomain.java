package com.klassa.shared.multitenancy;

import java.util.regex.Pattern;

/**
 * Single source of truth for tenant subdomain validation.
 * <p>
 * The subdomain becomes a Postgres schema name and is interpolated into
 * {@code SET search_path TO "<subdomain>"} in {@link SchemaMultiTenantProvider}.
 * Restricting it to {@code [a-z0-9-]} (no quotes, no whitespace) keeps that
 * interpolation safe and matches the {@code @Pattern} used on the tenant DTOs.
 */
public final class TenantSubdomain {

    /** Lowercase alphanumeric with hyphens, 3..50 chars. */
    public static final Pattern PATTERN = Pattern.compile("^[a-z0-9-]{3,50}$");

    private TenantSubdomain() {}

    public static boolean isValid(String subdomain) {
        return subdomain != null && PATTERN.matcher(subdomain).matches();
    }
}
