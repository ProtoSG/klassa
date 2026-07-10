package com.klassa.student;

import com.klassa.shared.security.SecurityUser;
import com.klassa.shared.web.ApiResponse;
import com.klassa.shared.web.PageResponse;
import com.klassa.student.dto.StudentRequest;
import com.klassa.student.dto.StudentResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/students")
@Tag(name = "Students")
@SecurityRequirement(name = "bearerAuth")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponse>> create(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(studentService.create(request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TREASURER') " +
            "or (hasRole('TEACHER') and @academicSecurity.teachesStudent(#id, authentication.principal.userId)) " +
            "or (hasRole('PARENT') and @familySecurity.ownsStudent(#id, authentication.principal.userId))")
    public ResponseEntity<ApiResponse<StudentResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.findById(id)));
    }

    // Row-level scoping (TEACHER sees only their own students) happens inside
    // StudentService.search, based on the resolved principal — not expressible via @PreAuthorize
    // for a paginated/filtered list.
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('TREASURER')")
    public ResponseEntity<ApiResponse<PageResponse<StudentResponse>>> findAll(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) StudentStatus status,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal SecurityUser principal) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.search(status, search, principal, pageable)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponse>> update(
            @PathVariable Long id, @Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.update(id, request)));
    }

    @PatchMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponse>> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.uploadPhoto(id, file)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponse>> changeStatus(
            @PathVariable Long id, @RequestParam StudentStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.changeStatus(id, status)));
    }
}
