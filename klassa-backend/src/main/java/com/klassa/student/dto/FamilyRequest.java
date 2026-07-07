package com.klassa.student.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FamilyRequest(

        @NotBlank
        @Size(max = 200)
        String guardianName,

        @Size(max = 200)
        String guardianEmail,

        @Size(max = 20)
        String guardianPhone,

        String address,

        @Size(max = 200)
        String emergencyContact,

        @Size(max = 20)
        String emergencyPhone
) {}
