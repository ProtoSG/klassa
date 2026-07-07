package com.klassa.student.dto;

public record FamilyResponse(
        Long id,
        String guardianName,
        String guardianEmail,
        String guardianPhone,
        String address,
        String emergencyContact,
        String emergencyPhone
) {}
