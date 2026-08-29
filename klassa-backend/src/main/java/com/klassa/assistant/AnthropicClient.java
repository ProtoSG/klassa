package com.klassa.assistant;

import com.klassa.assistant.anthropic.AnthropicMessage;
import com.klassa.assistant.anthropic.AnthropicRequest;
import com.klassa.assistant.anthropic.AnthropicResponse;
import com.klassa.assistant.anthropic.ContentBlock;
import com.klassa.assistant.anthropic.ToolDefinition;
import com.klassa.assistant.llm.LlmClient;
import com.klassa.assistant.llm.LlmMessage;
import com.klassa.assistant.llm.LlmTool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;

/**
 * Anthropic Messages API implementation of {@link LlmClient}. Encapsulates the full tool-use
 * conversation loop in Anthropic's wire format so the caller never needs to know the provider-specific
 * message shape.
 */
@Component
@ConditionalOnProperty(name = "llm.provider", havingValue = "anthropic", matchIfMissing = true)
public class AnthropicClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(AnthropicClient.class);

    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";
    private static final int MAX_TOKENS = 2048;
    private static final int MAX_TOOL_LOOP_ITERATIONS = 5;
    private static final String FALLBACK_MESSAGE =
            "No pude completar tu consulta en este momento. Por favor, intenta reformular tu pregunta.";

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public AnthropicClient(@Value("${anthropic.api-key}") String apiKey,
                           @Value("${anthropic.model}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        this.restClient = RestClient.create();
    }

    @Override
    public String chat(String systemPrompt,
                       List<LlmMessage> history,
                       List<LlmTool> tools,
                       ToolExecutor toolExecutor) {

        List<AnthropicMessage> messages = new ArrayList<>();
        for (LlmMessage turn : history) {
            messages.add(new AnthropicMessage(turn.role(), turn.content()));
        }

        List<ToolDefinition> toolDefs = tools.stream()
                .map(t -> new ToolDefinition(t.name(), t.description(), t.inputSchema()))
                .toList();

        try {
            for (int iteration = 0; iteration < MAX_TOOL_LOOP_ITERATIONS; iteration++) {
                AnthropicResponse response = sendRequest(systemPrompt, messages, toolDefs);

                if (!response.isToolUse()) {
                    String text = response.firstText();
                    return text != null ? text : FALLBACK_MESSAGE;
                }

                List<ContentBlock> toolUseBlocks = response.content().stream()
                        .filter(b -> "tool_use".equals(b.type()))
                        .toList();
                if (toolUseBlocks.isEmpty()) {
                    break;
                }

                messages.add(AnthropicMessage.assistant(response.content()));

                List<ContentBlock> toolResults = new ArrayList<>();
                for (ContentBlock block : toolUseBlocks) {
                    LlmClient.ToolCallResult result = toolExecutor.execute(block.name(), block.input());
                    toolResults.add(ContentBlock.toolResult(block.id(), result.content(), result.isError()));
                }
                messages.add(AnthropicMessage.userToolResults(toolResults));
            }
        } catch (RestClientException e) {
            log.warn("Anthropic API call failed", e);
            throw new LlmUnavailableException("Anthropic API call failed", e);
        }

        return FALLBACK_MESSAGE;
    }

    private AnthropicResponse sendRequest(String systemPrompt,
                                          List<AnthropicMessage> messages,
                                          List<ToolDefinition> tools) {
        AnthropicRequest request = new AnthropicRequest(model, MAX_TOKENS, systemPrompt, messages, tools);
        return restClient.post()
                .uri(API_URL)
                .header("x-api-key", apiKey)
                .header("anthropic-version", ANTHROPIC_VERSION)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(AnthropicResponse.class);
    }
}
