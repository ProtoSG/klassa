package com.klassa.academic.dto;

import com.klassa.academic.EnrollmentStatus;

import java.time.LocalDateTime;

public record EnrollmentResponse(
        Long id,
        Long studentId,
        String studentName,
        String studentCode,
        Long sectionId,
        String sectionName,
        LocalDateTime enrolledAt,
        EnrollmentStatus status,
        // Populated by AcademicMapper when the enrollment's student has a family. Used by
        // the attendance screen's "notify absentees via WhatsApp" panel — without these
        // we'd need an N+1 fetch per row, so we hydrate them eagerly via the mapper.
        String guardianName,
        String guardianPhone
) {}
