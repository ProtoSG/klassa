package com.klassa.assistant.openrouter;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * A single tool call inside an OpenAI-compatible assistant message.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenRouterToolCall(
        String id,
        OpenRouterFunctionCall function
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpenRouterFunctionCall(
            String name,
            String arguments
    ) {
    }
}
