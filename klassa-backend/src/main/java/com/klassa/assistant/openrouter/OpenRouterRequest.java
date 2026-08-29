package com.klassa.assistant.openrouter;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * OpenAI-compatible chat completions request (also used by OpenRouter).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OpenRouterRequest(
        String model,
        @JsonProperty("max_tokens") int maxTokens,
        List<OpenRouterMessage> messages,
        List<OpenRouterTool> tools
) {
}
