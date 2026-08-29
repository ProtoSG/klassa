package com.klassa.assistant.llm;

import java.util.Map;

/**
 * Provider-agnostic tool definition. Each {@link LlmClient} implementation converts this
 * into the provider-specific wire format internally.
 */
public record LlmTool(String name, String description, Map<String, Object> inputSchema) {
}
