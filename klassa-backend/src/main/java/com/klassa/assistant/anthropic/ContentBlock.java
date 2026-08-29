package com.klassa.assistant.anthropic;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * A single content block, in either direction of the Messages API conversation.
 * <p>
 * Covers every shape this app sends or receives: {@code text} (assistant final answer),
 * {@code tool_use} (assistant asking to call a tool), and {@code tool_result} (our reply with the
 * tool's output). All fields are nullable and only the ones relevant to {@code type} are
 * populated; {@code @JsonInclude(NON_NULL)} keeps outgoing JSON free of irrelevant nulls, and
 * {@code @JsonIgnoreProperties(ignoreUnknown = true)} tolerates response block types we don't
 * model (e.g. {@code thinking}).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record ContentBlock(
        String type,
        String text,
        String id,
        String name,
        JsonNode input,
        @JsonProperty("tool_use_id") String toolUseId,
        Object content,
        @JsonProperty("is_error") Boolean isError
) {

    public static ContentBlock toolResult(String toolUseId, String content, boolean isError) {
        return new ContentBlock("tool_result", null, null, null, null, toolUseId, content, isError ? true : null);
    }

    public static ContentBlock toolUseEcho(String id, String name, JsonNode input) {
        return new ContentBlock("tool_use", null, id, name, input, null, null, null);
    }
}
