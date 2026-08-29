package com.klassa.assistant.llm;

/**
 * Provider-agnostic message in a conversation. {@code content} is {@link Object} because it can
 * be a plain {@link String} (user/assistant text turn) or a list of provider-specific content
 * blocks (tool-use turn). Each {@link LlmClient} implementation handles the conversion to its
 * wire format.
 */
public record LlmMessage(String role, Object content) {
}
