package com.klassa.notification;

import com.klassa.notification.dto.NotificationResponse;
import com.klassa.shared.security.SecurityUser;
import com.klassa.shared.web.ApiResponse;
import com.klassa.shared.web.PageResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // Self-scoped by design (authentication.principal.userId, never a path variable) — every
    // authenticated role can read/manage its own notifications, no role check needed.

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> findMine(
            @AuthenticationPrincipal SecurityUser principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateCreated"));
        return ResponseEntity.ok(ApiResponse.ok(notificationService.findMine(principal.userId(), pageable)));
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<ApiResponse<Long>> unreadCount(@AuthenticationPrincipal SecurityUser principal) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.unreadCount(principal.userId())));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable Long id, @AuthenticationPrincipal SecurityUser principal) {
        notificationService.markRead(id, principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/me/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal SecurityUser principal) {
        notificationService.markAllRead(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
