package com.klassa.assistant;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.klassa.assistant.llm.LlmClient;
import com.klassa.assistant.llm.LlmMessage;
import com.klassa.assistant.llm.LlmTool;
import com.klassa.assistant.openrouter.OpenRouterMessage;
import com.klassa.assistant.openrouter.OpenRouterRequest;
import com.klassa.assistant.openrouter.OpenRouterResponse;
import com.klassa.assistant.openrouter.OpenRouterTool;
import com.klassa.assistant.openrouter.OpenRouterToolCall;
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
import java.util.Map;

/**
 * OpenRouter (OpenAI-compatible) implementation of {@link LlmClient}.
 * Encapsulates the full tool-use conversation loop in OpenAI's wire format.
 */
@Component
@ConditionalOnProperty(name = "llm.provider", havingValue = "openrouter")
public class OpenRouterClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(OpenRouterClient.class);

    private static final String API_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final int MAX_TOKENS = 2048;
    private static final int MAX_TOOL_LOOP_ITERATIONS = 5;
    private static final String FALLBACK_MESSAGE =
            "No pude completar tu consulta en este momento. Por favor, intenta reformular tu pregunta.";

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final ObjectMapper objectMapper;

    public OpenRouterClient(@Value("${openrouter.api-key}") String apiKey,
                            @Value("${openrouter.model}") String model,
                            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    @Override
    public String chat(String systemPrompt,
                       List<LlmMessage> history,
                       List<LlmTool> tools,
                       ToolExecutor toolExecutor) {

        List<OpenRouterMessage> messages = new ArrayList<>();
        messages.add(OpenRouterMessage.system(systemPrompt));
        for (LlmMessage turn : history) {
            if ("user".equals(turn.role())) {
                if (turn.content() instanceof String text) {
                    messages.add(OpenRouterMessage.user(text));
                } else if (turn.content() instanceof List<?>) {
                    @SuppressWarnings("unchecked")
                    List<OpenRouterMessage> toolMsgs = (List<OpenRouterMessage>) turn.content();
                    messages.addAll(toolMsgs);
                }
            } else if ("assistant".equals(turn.role())) {
                if (turn.content() instanceof String text) {
                    messages.add(OpenRouterMessage.assistant(text));
                } else if (turn.content() instanceof JsonNode node) {
                    // Assistant turn with tool calls from previous Anthropic-format history —
                    // reconstruct as OpenRouter format
                    List<OpenRouterToolCall> toolCalls = parseAnthropicToolUseBlocks(node);
                    if (!toolCalls.isEmpty()) {
                        messages.add(OpenRouterMessage.assistantWithToolCalls(
                                objectMapper.valueToTree(toolCalls)));
                    }
                } else if (turn.content() instanceof List<?>) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> blocks = (List<Map<String, Object>>) turn.content();
                    List<OpenRouterToolCall> toolCalls = blocks.stream()
                            .filter(b -> "tool_use".equals(b.get("type")))
                            .map(b -> new OpenRouterToolCall(
                                    (String) b.get("id"),
                                    new OpenRouterToolCall.OpenRouterFunctionCall(
                                            (String) b.get("name"),
                                            serializeInput(b.get("input")))))
                            .toList();
                    messages.add(OpenRouterMessage.assistantWithToolCalls(
                            objectMapper.valueToTree(toolCalls)));
                }
            }
        }

        List<OpenRouterTool> toolDefs = tools.stream()
                .map(t -> OpenRouterTool.function(t.name(), t.description(), t.inputSchema()))
                .toList();

        try {
            for (int iteration = 0; iteration < MAX_TOOL_LOOP_ITERATIONS; iteration++) {
                OpenRouterResponse response = sendRequest(messages, toolDefs);

                if (!response.isToolUse()) {
                    String text = response.firstText();
                    return text != null ? text : FALLBACK_MESSAGE;
                }

                OpenRouterMessage assistantMsg = response.choices().get(0).message();
                messages.add(assistantMsg);

                List<OpenRouterToolCall> toolCalls = parseToolCalls(assistantMsg.toolCalls());
                if (toolCalls.isEmpty()) {
                    break;
                }

                for (OpenRouterToolCall tc : toolCalls) {
                    JsonNode inputNode = parseArguments(tc.function().arguments());
                    LlmClient.ToolCallResult result = toolExecutor.execute(tc.function().name(), inputNode);
                    messages.add(OpenRouterMessage.tool(tc.id(), result.content()));
                }
            }
        } catch (RestClientException e) {
            log.warn("OpenRouter API call failed", e);
            throw new LlmUnavailableException("OpenRouter API call failed", e);
        }

        return FALLBACK_MESSAGE;
    }

    private List<OpenRouterToolCall> parseToolCalls(JsonNode toolCallsNode) {
        if (toolCallsNode == null || !toolCallsNode.isArray() || toolCallsNode.isEmpty()) {
            return List.of();
        }
        List<OpenRouterToolCall> result = new ArrayList<>();
        for (JsonNode tc : toolCallsNode) {
            String id = tc.has("id") ? tc.get("id").asText() : null;
            JsonNode fn = tc.get("function");
            if (fn != null) {
                String name = fn.has("name") ? fn.get("name").asText() : "";
                String args = fn.has("arguments") ? fn.get("arguments").asText() : "{}";
                result.add(new OpenRouterToolCall(id,
                        new OpenRouterToolCall.OpenRouterFunctionCall(name, args)));
            }
        }
        return result;
    }

    private List<OpenRouterToolCall> parseAnthropicToolUseBlocks(JsonNode contentArray) {
        List<OpenRouterToolCall> result = new ArrayList<>();
        if (contentArray == null || !contentArray.isArray()) return result;
        for (JsonNode block : contentArray) {
            if ("tool_use".equals(block.path("type").asText())) {
                result.add(new OpenRouterToolCall(
                        block.path("id").asText(),
                        new OpenRouterToolCall.OpenRouterFunctionCall(
                                block.path("name").asText(),
                                serializeInput(block.get("input")))));
            }
        }
        return result;
    }

    private OpenRouterResponse sendRequest(List<OpenRouterMessage> messages,
                                           List<OpenRouterTool> tools) {
        OpenRouterRequest request = new OpenRouterRequest(model, MAX_TOKENS, messages, tools);
        return restClient.post()
                .uri(API_URL)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(OpenRouterResponse.class);
    }

    private JsonNode parseArguments(String arguments) {
        try {
            return objectMapper.readTree(arguments);
        } catch (JsonProcessingException e) {
            return objectMapper.createObjectNode();
        }
    }

    private String serializeInput(Object input) {
        try {
            return objectMapper.writeValueAsString(input);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
