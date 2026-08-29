package com.klassa.assistant.openrouter;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * OpenAI-compatible tool definition.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OpenRouterTool(String type, OpenRouterFunction function) {

    public static OpenRouterTool function(String name, String description, Map<String, Object> parameters) {
        return new OpenRouterTool("function", new OpenRouterFunction(name, description, parameters));
    }

    public record OpenRouterFunction(String name, String description, Map<String, Object> parameters) {
    }
}
