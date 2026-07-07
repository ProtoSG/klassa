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
        EnrollmentStatus status
) {}
