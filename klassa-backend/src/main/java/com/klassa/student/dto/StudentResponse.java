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
        /** Populated from {@code student.family.guardianPhone} when the student has a family.
         *  Used by the billing screen's "recordar pago por WhatsApp" action and the
         *  attendance screen's "notificar ausentes" panel. */
        String guardianPhone,
        String photoUrl
) {}
