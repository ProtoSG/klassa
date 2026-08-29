package com.klassa.assistant;

/**
 * Outcome of dispatching one Claude {@code tool_use} block: the JSON-serialized payload (or a
 * short user-facing error message) plus whether it should be sent back as an
 * {@code is_error: true} {@code tool_result} content block.
 */
public record ToolResult(String content, boolean isError) {
}
