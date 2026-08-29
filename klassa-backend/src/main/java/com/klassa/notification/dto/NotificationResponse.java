package com.klassa.notification.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String message,
        Long studentId,
        String studentName,
        boolean read,
        LocalDateTime createdAt
) {}
