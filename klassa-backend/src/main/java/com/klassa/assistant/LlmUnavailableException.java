package com.klassa.assistant;

/**
 * Thrown when the LLM provider (Anthropic, OpenRouter, etc.) is unreachable or returns an error.
 * Maps to {@link com.klassa.shared.exception.ErrorCode#ASSISTANT_UNAVAILABLE} in the controller layer.
 */
public class LlmUnavailableException extends RuntimeException {
    public LlmUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
