package com.klassa.assistant;

import com.klassa.assistant.dto.ChatMessageDto;
import com.klassa.assistant.dto.ChatRequest;
import com.klassa.plan.RequiresModule;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.security.SecurityUser;
import com.klassa.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
@Tag(name = "Assistant")
@SecurityRequirement(name = "bearerAuth")
public class AssistantController {

    private static final int MAX_HISTORY_MESSAGES = 40;

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    // Universally reachable by every tenant role — per-tool authorization inside AssistantTools
    // (mirroring each matching REST endpoint's own @PreAuthorize) is what actually restricts data.
    @PostMapping("/chat")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('TREASURER') or hasRole('PARENT')")
    @RequiresModule("assistant")
    public ResponseEntity<ApiResponse<ChatMessageDto>> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal SecurityUser principal) {
        if (request.messages().size() > MAX_HISTORY_MESSAGES) {
            throw new BusinessRuleException(ErrorCode.ASSISTANT_TOO_MANY_MESSAGES, MAX_HISTORY_MESSAGES);
        }
        return ResponseEntity.ok(ApiResponse.ok(assistantService.chat(request.messages(), principal)));
    }
}
