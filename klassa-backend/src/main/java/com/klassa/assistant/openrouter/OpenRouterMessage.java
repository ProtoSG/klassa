package com.klassa.assistant.openrouter;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * OpenAI-compatible message format used by OpenRouter.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OpenRouterMessage(
        String role,
        String content,
        @JsonProperty("tool_calls") JsonNode toolCalls,
        @JsonProperty("tool_call_id") String toolCallId
) {
    public static OpenRouterMessage system(String text) {
        return new OpenRouterMessage("system", text, null, null);
    }

    public static OpenRouterMessage user(String text) {
        return new OpenRouterMessage("user", text, null, null);
    }

    public static OpenRouterMessage assistant(String text) {
        return new OpenRouterMessage("assistant", text, null, null);
    }

    public static OpenRouterMessage assistantWithToolCalls(JsonNode toolCalls) {
        return new OpenRouterMessage("assistant", null, toolCalls, null);
    }

    public static OpenRouterMessage tool(String toolCallId, String content) {
        return new OpenRouterMessage("tool", content, null, toolCallId);
    }
}
