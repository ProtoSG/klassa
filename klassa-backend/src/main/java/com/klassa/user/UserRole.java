package com.klassa.user;

public enum UserRole {
    // Tenant-level roles (live in each colegio's schema)
    ADMIN,
    TEACHER,
    TREASURER,
    PARENT,
    // Platform-level roles (live in platform.platform_users)
    PLATFORM_ADMIN,
    SUPPORT
}
