package com.klassa.assistant.anthropic;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Response shape for {@code POST /v1/messages}. Only the fields this app reads are modeled;
 * everything else (usage, stop_sequence, etc.) is ignored rather than mapped.
 * <p>
 * {@code stopReason} is {@code "tool_use"} when {@code content} contains one or more
 * {@code tool_use} blocks (possibly alongside {@code text} blocks) that must be dispatched before
 * continuing the conversation, or {@code "end_turn"} (or another terminal reason) when
 * {@code content} holds the final answer as {@code text} blocks.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AnthropicResponse(
        String id,
        String model,
        List<ContentBlock> content,
        @JsonProperty("stop_reason") String stopReason
) {

    public boolean isToolUse() {
        return "tool_use".equals(stopReason);
    }

    public String firstText() {
        if (content == null) return null;
        return content.stream()
                .filter(b -> "text".equals(b.type()))
                .map(ContentBlock::text)
                .findFirst()
                .orElse(null);
    }
}
