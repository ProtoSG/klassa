package com.klassa.attendance;

import com.klassa.attendance.dto.AttendancePercentageResponse;
import com.klassa.attendance.dto.AttendanceRequest;
import com.klassa.attendance.dto.AttendanceResponse;
import com.klassa.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@Tag(name = "Attendance")
@SecurityRequirement(name = "bearerAuth")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> register(
            @Valid @RequestBody AttendanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(attendanceService.register(request)));
    }

    @GetMapping("/enrollment/{enrollmentId}")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> findByEnrollment(
            @PathVariable Long enrollmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<AttendanceResponse> result = (start != null && end != null)
                ? attendanceService.findByEnrollmentAndRange(enrollmentId, start, end)
                : attendanceService.findByEnrollment(enrollmentId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/section/{sectionId}/date/{date}")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> findBySectionAndDate(
            @PathVariable Long sectionId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(
                attendanceService.findBySectionAndDate(sectionId, date)));
    }

    @GetMapping("/enrollment/{enrollmentId}/percentage")
    public ResponseEntity<ApiResponse<AttendancePercentageResponse>> getPercentage(
            @PathVariable Long enrollmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.ok(
                attendanceService.getPercentage(enrollmentId, start, end)));
    }
}
