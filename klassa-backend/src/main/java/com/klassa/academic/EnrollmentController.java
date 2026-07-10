package com.klassa.academic;

import com.klassa.academic.dto.EnrollmentRequest;
import com.klassa.academic.dto.EnrollmentResponse;
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
@RequestMapping("/api/enrollments")
@Tag(name = "Enrollments")
@SecurityRequirement(name = "bearerAuth")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enroll(
            @Valid @RequestBody EnrollmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(enrollmentService.enroll(request)));
    }

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasRole('ADMIN') " +
            "or (hasRole('TEACHER') and @academicSecurity.ownsSection(#sectionId, authentication.principal.userId))")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> findBySection(
            @PathVariable Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(enrollmentService.findBySection(sectionId)));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('ADMIN') " +
            "or (hasRole('TEACHER') and @academicSecurity.teachesStudent(#studentId, authentication.principal.userId)) " +
            "or (hasRole('PARENT') and @familySecurity.ownsStudent(#studentId, authentication.principal.userId))")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> findByStudent(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(enrollmentService.findByStudent(studentId)));
    }

    @PostMapping("/{id}/transfer")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> transfer(
            @PathVariable Long id,
            @RequestParam Long newSectionId,
            @AuthenticationPrincipal SecurityUser principal) {
        return ResponseEntity.ok(ApiResponse.ok(
                enrollmentService.transfer(id, newSectionId, principal.email())));
    }

    @PostMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> withdraw(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(enrollmentService.withdraw(id)));
    }
}
