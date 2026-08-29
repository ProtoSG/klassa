package com.klassa.assistant.openrouter;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * OpenAI-compatible chat completions response (also used by OpenRouter).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenRouterResponse(
        List<OpenRouterChoice> choices
) {

    public boolean isToolUse() {
        if (choices == null || choices.isEmpty()) return false;
        String finish = choices.get(0).finishReason();
        return "tool_calls".equals(finish);
    }

    public String firstText() {
        if (choices == null || choices.isEmpty()) return null;
        OpenRouterMessage msg = choices.get(0).message();
        return msg != null ? msg.content() : null;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpenRouterChoice(
            OpenRouterMessage message,
            @JsonProperty("finish_reason") String finishReason
    ) {
    }
}
