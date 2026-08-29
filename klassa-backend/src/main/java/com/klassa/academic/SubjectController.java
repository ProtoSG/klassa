package com.klassa.academic;

import com.klassa.academic.dto.SubjectRequest;
import com.klassa.academic.dto.SubjectResponse;
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

@RestController
@RequestMapping("/api/subjects")
@Tag(name = "Subjects")
@SecurityRequirement(name = "bearerAuth")
public class SubjectController {

    private final SubjectRepository subjectRepository;
    private final GradeLevelRepository gradeLevelRepository;

    public SubjectController(SubjectRepository subjectRepository,
                             GradeLevelRepository gradeLevelRepository) {
        this.subjectRepository = subjectRepository;
        this.gradeLevelRepository = gradeLevelRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubjectResponse>> create(@Valid @RequestBody SubjectRequest request) {
        GradeLevel gl = gradeLevelRepository.findById(request.gradeLevelId())
                .orElseThrow(() -> new EntityNotFoundException("GradeLevel", request.gradeLevelId()));
        Subject subject = new Subject();
        subject.setName(request.name());
        subject.setGradeLevel(gl);
        subject.setHoursPerWeek(request.hoursPerWeek() != null ? request.hoursPerWeek() : 1);
        subject.setActive(true);
        Subject saved = subjectRepository.save(subject);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(toResponse(saved, gl)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> findAll(
            @RequestParam(required = false) Long gradeLevelId) {
        List<Subject> result = gradeLevelId != null
                ? subjectRepository.findAllByGradeLevelId(gradeLevelId)
                : subjectRepository.findAllByActiveTrue();
        return ResponseEntity.ok(ApiResponse.ok(result.stream().map(this::toResponse).toList()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<SubjectResponse>> findById(@PathVariable Long id) {
        Subject subject = subjectRepository.findByIdWithGradeLevel(id)
                .orElseThrow(() -> new EntityNotFoundException("Subject", id));
        return ResponseEntity.ok(ApiResponse.ok(toResponse(subject)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubjectResponse>> update(
            @PathVariable Long id, @Valid @RequestBody SubjectRequest request) {
        Subject subject = subjectRepository.findByIdWithGradeLevel(id)
                .orElseThrow(() -> new EntityNotFoundException("Subject", id));
        subject.setName(request.name());
        if (request.hoursPerWeek() != null) subject.setHoursPerWeek(request.hoursPerWeek());
        Subject saved = subjectRepository.save(subject);
        return ResponseEntity.ok(ApiResponse.ok(toResponse(saved)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Subject", id));
        subject.setActive(false);
        subjectRepository.save(subject);
        return ResponseEntity.noContent().build();
    }

    private SubjectResponse toResponse(Subject s) {
        return toResponse(s, s.getGradeLevel());
    }

    private SubjectResponse toResponse(Subject s, GradeLevel gl) {
        return new SubjectResponse(s.getId(), s.getName(), gl.getId(), gl.getName(), s.getHoursPerWeek(), s.getActive());
    }
}
