package com.klassa.student;

import com.klassa.shared.web.ApiResponse;
import com.klassa.student.dto.FamilyRequest;
import com.klassa.student.dto.FamilyResponse;
import com.klassa.student.dto.StudentResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/families")
@Tag(name = "Families")
@SecurityRequirement(name = "bearerAuth")
public class FamilyController {

    private final StudentService studentService;

    public FamilyController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FamilyResponse>> create(@Valid @RequestBody FamilyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(studentService.createFamily(request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') " +
            "or (hasRole('PARENT') and @familySecurity.ownsFamily(#id, authentication.principal.userId))")
    public ResponseEntity<ApiResponse<FamilyResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.findFamilyById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FamilyResponse>> update(
            @PathVariable Long id, @Valid @RequestBody FamilyRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.updateFamily(id, request)));
    }

    @GetMapping("/{id}/students")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') " +
            "or (hasRole('PARENT') and @familySecurity.ownsFamily(#id, authentication.principal.userId))")
    public ResponseEntity<ApiResponse<List<StudentResponse>>> findStudents(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.findByFamily(id)));
    }
}
