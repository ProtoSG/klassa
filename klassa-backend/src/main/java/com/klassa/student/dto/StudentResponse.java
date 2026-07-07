package com.klassa.student.dto;

import com.klassa.student.Gender;
import com.klassa.student.StudentStatus;

import java.time.LocalDate;

public record StudentResponse(
        Long id,
        String code,
        String firstName,
        String lastName,
        String fullName,
        LocalDate birthDate,
        Gender gender,
        StudentStatus status,
        Long familyId,
        String guardianName,
        String photoUrl
) {}
