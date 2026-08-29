package com.klassa.assistant.dto;

import java.util.List;

public record ChatRequest(List<ChatMessageDto> messages) {
}
