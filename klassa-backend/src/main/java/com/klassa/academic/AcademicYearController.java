package com.klassa.academic;

import com.klassa.academic.dto.AcademicYearRequest;
import com.klassa.academic.dto.AcademicYearResponse;
import com.klassa.shared.security.SecurityUser;
import com.klassa.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academic-years")
@Tag(name = "Academic Years")
@SecurityRequirement(name = "bearerAuth")
public class AcademicYearController {

    private final AcademicYearService academicYearService;

    public AcademicYearController(AcademicYearService academicYearService) {
        this.academicYearService = academicYearService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AcademicYearResponse>> create(
            @Valid @RequestBody AcademicYearRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(academicYearService.create(request)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('TREASURER')")
    public ResponseEntity<ApiResponse<List<AcademicYearResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(academicYearService.findAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('TREASURER')")
    public ResponseEntity<ApiResponse<AcademicYearResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(academicYearService.findById(id)));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AcademicYearResponse>> activate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(academicYearService.activate(id)));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> close(@PathVariable Long id,
                                      @AuthenticationPrincipal SecurityUser principal) {
        academicYearService.close(id, principal.email());
        return ResponseEntity.noContent().build();
    }
}
