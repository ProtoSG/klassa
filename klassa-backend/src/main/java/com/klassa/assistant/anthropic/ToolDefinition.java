package com.klassa.assistant.anthropic;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * A tool exposed to Claude, in the {@code {name, description, input_schema}} shape the Messages
 * API expects. {@code inputSchema} is a plain JSON-schema object (see {@link com.klassa.assistant.AssistantTools}
 * for the schemas used by this app's five tools).
 */
public record ToolDefinition(
        String name,
        String description,
        @JsonProperty("input_schema") Map<String, Object> inputSchema
) {
}
