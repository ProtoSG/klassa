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

    @GetMapping("/enrollment/{enrollmentId}")
    public ResponseEntity<ApiResponse<List<ScoreResponse>>> findByEnrollment(
            @PathVariable Long enrollmentId,
            @RequestParam(required = false) Integer period) {
        List<ScoreResponse> result = period != null
                ? scoreService.findByEnrollmentAndPeriod(enrollmentId, period)
                : scoreService.findByEnrollment(enrollmentId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/enrollment/{enrollmentId}/average")
    public ResponseEntity<ApiResponse<BigDecimal>> getAverage(@PathVariable Long enrollmentId) {
        return ResponseEntity.ok(ApiResponse.ok(scoreService.getAverage(enrollmentId)));
    }

    @GetMapping("/enrollment/{enrollmentId}/average/period/{period}")
    public ResponseEntity<ApiResponse<BigDecimal>> getPeriodAverage(
            @PathVariable Long enrollmentId, @PathVariable Integer period) {
        return ResponseEntity.ok(ApiResponse.ok(scoreService.getPeriodAverage(enrollmentId, period)));
    }
}
