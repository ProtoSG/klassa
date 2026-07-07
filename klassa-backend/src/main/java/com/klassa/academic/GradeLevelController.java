package com.klassa.academic;

import com.klassa.academic.dto.GradeLevelRequest;
import com.klassa.academic.dto.GradeLevelResponse;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/grade-levels")
@Tag(name = "Grade Levels")
@SecurityRequirement(name = "bearerAuth")
public class GradeLevelController {

    private final GradeLevelRepository gradeLevelRepository;

    public GradeLevelController(GradeLevelRepository gradeLevelRepository) {
        this.gradeLevelRepository = gradeLevelRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GradeLevelResponse>> create(@Valid @RequestBody GradeLevelRequest request) {
        GradeLevel gl = new GradeLevel();
        gl.setName(request.name());
        gl.setLevel(request.level());
        gl.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 0);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(toResponse(gradeLevelRepository.save(gl))));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GradeLevelResponse>>> findAll(
            @RequestParam(required = false) GradeLevelType level) {
        List<GradeLevel> result = level != null
                ? gradeLevelRepository.findAllByLevel(level)
                : gradeLevelRepository.findAllByOrderBySortOrderAsc();
        return ResponseEntity.ok(ApiResponse.ok(result.stream().map(this::toResponse).toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GradeLevelResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(
                toResponse(gradeLevelRepository.findById(id)
                        .orElseThrow(() -> new EntityNotFoundException("GradeLevel", id)))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GradeLevelResponse>> update(
            @PathVariable Long id, @Valid @RequestBody GradeLevelRequest request) {
        GradeLevel gl = gradeLevelRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("GradeLevel", id));
        gl.setName(request.name());
        gl.setLevel(request.level());
        if (request.sortOrder() != null) gl.setSortOrder(request.sortOrder());
        return ResponseEntity.ok(ApiResponse.ok(toResponse(gradeLevelRepository.save(gl))));
    }

    @GetMapping("/grouped")
    public ResponseEntity<ApiResponse<Map<GradeLevelType, List<GradeLevelResponse>>>> grouped() {
        Map<GradeLevelType, List<GradeLevelResponse>> grouped = gradeLevelRepository
                .findAllByOrderBySortOrderAsc().stream()
                .collect(Collectors.groupingBy(GradeLevel::getLevel,
                        Collectors.mapping(this::toResponse, Collectors.toList())));
        return ResponseEntity.ok(ApiResponse.ok(grouped));
    }

    private GradeLevelResponse toResponse(GradeLevel gl) {
        return new GradeLevelResponse(gl.getId(), gl.getName(), gl.getLevel(), gl.getSortOrder());
    }
}
