package com.klassa.assistant.dto;

/**
 * One turn in the assistant conversation as seen by the frontend/API contract.
 * {@code role} is either {@code "user"} or {@code "assistant"}.
 */
public record ChatMessageDto(String role, String content) {
}
