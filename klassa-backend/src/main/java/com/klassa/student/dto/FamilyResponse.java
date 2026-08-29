package com.klassa.student.dto;

public record FamilyResponse(
        Long id,
        String guardianName,
        String guardianEmail,
        String guardianPhone,
        String address,
        String emergencyContact,
        String emergencyPhone,
        /** Email of the User account linked as this family's PARENT login, or null if none yet. */
        String linkedUserEmail
) {}
