package com.klassa.academic;

import com.klassa.academic.dto.SectionRequest;
import com.klassa.academic.dto.SectionResponse;
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
@RequestMapping("/api/sections")
@Tag(name = "Sections")
@SecurityRequirement(name = "bearerAuth")
public class SectionController {

    private final SectionService sectionService;

    public SectionController(SectionService sectionService) {
        this.sectionService = sectionService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SectionResponse>> create(@Valid @RequestBody SectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(sectionService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SectionResponse>>> findByAcademicYear(
            @RequestParam Long academicYearId) {
        return ResponseEntity.ok(ApiResponse.ok(sectionService.findByAcademicYear(academicYearId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SectionResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(sectionService.findById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SectionResponse>> update(
            @PathVariable Long id, @Valid @RequestBody SectionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(sectionService.update(id, request)));
    }
}
