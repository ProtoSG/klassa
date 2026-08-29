package com.klassa.assistant.anthropic;

/**
 * One entry in the {@code messages} array sent to the Messages API.
 * <p>
 * {@code content} is intentionally {@link Object}, not {@link String}: a plain user/assistant
 * text turn serializes {@code content} as a JSON string, while a tool-use/tool-result turn needs
 * {@code content} to serialize as a JSON array of content-block objects (see
 * {@link ContentBlock#toolUse} / {@link ContentBlock#toolResult}). Jackson picks the right shape
 * from the runtime type without any extra configuration.
 */
public record AnthropicMessage(String role, Object content) {

    public static AnthropicMessage user(String text) {
        return new AnthropicMessage("user", text);
    }

    public static AnthropicMessage assistant(String text) {
        return new AnthropicMessage("assistant", text);
    }

    public static AnthropicMessage assistant(java.util.List<ContentBlock> blocks) {
        return new AnthropicMessage("assistant", blocks);
    }

    public static AnthropicMessage userToolResults(java.util.List<ContentBlock> toolResults) {
        return new AnthropicMessage("user", toolResults);
    }
}
