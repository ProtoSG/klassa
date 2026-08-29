package com.klassa.academic;

import com.klassa.academic.dto.TeachingAssignmentRequest;
import com.klassa.academic.dto.TeachingAssignmentResponse;
import com.klassa.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teaching-assignments")
@Tag(name = "Teaching Assignments")
@SecurityRequirement(name = "bearerAuth")
public class TeachingAssignmentController {

    private final TeachingAssignmentService teachingAssignmentService;

    public TeachingAssignmentController(TeachingAssignmentService teachingAssignmentService) {
        this.teachingAssignmentService = teachingAssignmentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TeachingAssignmentResponse>> assign(
            @Valid @RequestBody TeachingAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(teachingAssignmentService.assign(request)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<List<TeachingAssignmentResponse>>> findBySection(
            @RequestParam Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(teachingAssignmentService.findBySection(sectionId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        teachingAssignmentService.remove(id);
        return ResponseEntity.noContent().build();
    }
}
