package com.klassa.assistant.llm;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/**
 * Provider-agnostic LLM client. Each implementation encapsulates the full tool-use conversation
 * loop (including message format, tool result insertion, and iteration cap) so the caller
 * ({@code AssistantService}) never needs to know the provider-specific wire format.
 */
public interface LlmClient {

    /**
     * Runs the full conversation loop: sends the history + system prompt with tool definitions,
     * dispatches tool calls via {@code toolExecutor}, and returns the final text answer.
     *
     * @param systemPrompt the assistant's system-level instructions
     * @param history      the conversation so far (role = "user" | "assistant")
     * @param tools        the tools available to the model
     * @param toolExecutor receives (toolName, inputJson) and returns a {@link ToolCallResult}
     * @return the assistant's final text reply
     */
    String chat(String systemPrompt,
                List<LlmMessage> history,
                List<LlmTool> tools,
                ToolExecutor toolExecutor);

    @FunctionalInterface
    interface ToolExecutor {
        ToolCallResult execute(String toolName, JsonNode input);
    }

    record ToolCallResult(String content, boolean isError) {
    }
}
