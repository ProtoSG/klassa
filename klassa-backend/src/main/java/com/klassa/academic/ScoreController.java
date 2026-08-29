package com.klassa.academic;

import com.klassa.academic.dto.ScoreRequest;
import com.klassa.academic.dto.ScoreResponse;
import com.klassa.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/scores")
@Tag(name = "Scores")
@SecurityRequirement(name = "bearerAuth")
public class ScoreController {

    private final ScoreService scoreService;

    public ScoreController(ScoreService scoreService) {
        this.scoreService = scoreService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<ScoreResponse>> save(@Valid @RequestBody ScoreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(scoreService.save(request)));
    }

    // Score reads are section-level for TEACHER (homeroom tutor OR any subject teacher in the
    // section) — deliberately broader than AttendanceController's homeroom-only OWNS_ENROLLMENT,
    // since GET /scores/enrollment/{id} returns all subjects for a student in one call.
    private static final String CAN_VIEW_SCORES =
            "hasRole('ADMIN') " +
            "or (hasRole('TEACHER') and (@academicSecurity.ownsEnrollment(#enrollmentId, authentication.principal.userId) " +
            "or @academicSecurity.teachesInEnrollmentSection(#enrollmentId, authentication.principal.userId))) " +
            "or (hasRole('PARENT') and @familySecurity.ownsEnrollment(#enrollmentId, authentication.principal.userId))";

    @GetMapping("/enrollment/{enrollmentId}")
    @PreAuthorize(CAN_VIEW_SCORES)
    public ResponseEntity<ApiResponse<List<ScoreResponse>>> findByEnrollment(
            @PathVariable Long enrollmentId,
            @RequestParam(required = false) Integer period) {
        List<ScoreResponse> result = period != null
                ? scoreService.findByEnrollmentAndPeriod(enrollmentId, period)
                : scoreService.findByEnrollment(enrollmentId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/enrollment/{enrollmentId}/average")
    @PreAuthorize(CAN_VIEW_SCORES)
    public ResponseEntity<ApiResponse<BigDecimal>> getAverage(@PathVariable Long enrollmentId) {
        return ResponseEntity.ok(ApiResponse.ok(scoreService.getAverage(enrollmentId)));
    }

    @GetMapping("/enrollment/{enrollmentId}/average/period/{period}")
    @PreAuthorize(CAN_VIEW_SCORES)
    public ResponseEntity<ApiResponse<BigDecimal>> getPeriodAverage(
            @PathVariable Long enrollmentId, @PathVariable Integer period) {
        return ResponseEntity.ok(ApiResponse.ok(scoreService.getPeriodAverage(enrollmentId, period)));
    }
}
