package com.klassa.student;

import com.klassa.shared.web.ApiResponse;
import com.klassa.student.dto.FamilyRequest;
import com.klassa.student.dto.FamilyResponse;
import com.klassa.student.dto.StudentResponse;
import com.klassa.shared.security.SecurityUser;
import com.klassa.user.UserRole;
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

    // Static "/me" routes are matched before the "/{id}" template by Spring's
    // handler mapping, so this is safe to declare alongside it.
    @GetMapping("/me")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<ApiResponse<FamilyResponse>> findMyFamily(@AuthenticationPrincipal SecurityUser principal) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.findMyFamily(principal.userId())));
    }

    @GetMapping("/me/students")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<ApiResponse<List<StudentResponse>>> findMyChildren(@AuthenticationPrincipal SecurityUser principal) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.findMyChildren(principal.userId())));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') " +
            "or (hasRole('PARENT') and @familySecurity.ownsFamily(#id, authentication.principal.userId))")
    public ResponseEntity<ApiResponse<FamilyResponse>> findById(
            @PathVariable Long id, @AuthenticationPrincipal SecurityUser principal) {
        FamilyResponse response = studentService.findFamilyById(id);
        // linkedUserEmail is the family's portal-login address, not a contact
        // field — only ADMIN (manages accounts) and the owning PARENT (already
        // scoped above) need it. TEACHER keeps seeing every other family field.
        if (principal.role() == UserRole.TEACHER) {
            response = new FamilyResponse(response.id(), response.guardianName(), response.guardianEmail(),
                    response.guardianPhone(), response.address(), response.emergencyContact(),
                    response.emergencyPhone(), null);
        }
        return ResponseEntity.ok(ApiResponse.ok(response));
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
