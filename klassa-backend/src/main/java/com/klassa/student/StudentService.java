package com.klassa.student;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.multitenancy.TenantContext;
import com.klassa.shared.storage.S3StorageService;
import com.klassa.shared.storage.StorageService;
import com.klassa.shared.web.PageResponse;
import com.klassa.student.dto.FamilyRequest;
import com.klassa.student.dto.FamilyResponse;
import com.klassa.student.dto.StudentRequest;
import com.klassa.student.dto.StudentResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class StudentService {

    private static final Logger log = LoggerFactory.getLogger(StudentService.class);
    private static final List<String> ALLOWED_IMAGE_TYPES = List.of("image/jpeg", "image/png");
    private static final long MAX_PHOTO_BYTES = 5L * 1024 * 1024;
    private static final Duration PHOTO_PRESIGN_TTL = Duration.ofHours(1);

    private final StudentRepository studentRepository;
    private final FamilyRepository familyRepository;
    private final StudentMapper studentMapper;
    private final StorageService storageService;
    private final StudentCodeGenerator studentCodeGenerator;

    public StudentService(StudentRepository studentRepository, FamilyRepository familyRepository,
                          StudentMapper studentMapper, StorageService storageService,
                          StudentCodeGenerator studentCodeGenerator) {
        this.studentRepository = studentRepository;
        this.familyRepository = familyRepository;
        this.studentMapper = studentMapper;
        this.storageService = storageService;
        this.studentCodeGenerator = studentCodeGenerator;
    }

    // Redis cache is shared across tenants, but entity ids are only unique per tenant schema.
    // Prefix every key with the current tenant so tenant A's id=1 can't read tenant B's id=1.
    private static final String TENANT_KEY =
            "T(com.klassa.shared.multitenancy.TenantContext).getCurrentTenant() + ':' + #id";

    @Transactional
    @CacheEvict(value = "students", allEntries = true)
    public StudentResponse create(StudentRequest request) {
        String code = request.code();
        if (code == null || code.isBlank()) {
            code = studentCodeGenerator.nextCode();
        } else if (studentRepository.existsByCode(code)) {
            throw new BusinessRuleException(ErrorCode.STUDENT_CODE_TAKEN, code);
        }
        Student student = buildStudent(new Student(), request, code);
        return toResponse(studentRepository.save(student));
    }

    @Cacheable(value = "students", key = TENANT_KEY)
    public StudentResponse findById(Long id) {
        return studentRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Student", id));
    }

    public PageResponse<StudentResponse> findAll(Pageable pageable) {
        return PageResponse.of(studentRepository.findAll(pageable).map(this::toResponse));
    }

    public PageResponse<StudentResponse> findByStatus(StudentStatus status, Pageable pageable) {
        return PageResponse.of(
                studentRepository.findAllByStatus(status, pageable).map(this::toResponse));
    }

    public List<StudentResponse> findByFamily(Long familyId) {
        return studentRepository.findAllByFamilyId(familyId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    @CacheEvict(value = "students", key = TENANT_KEY)
    public StudentResponse update(Long id, StudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Student", id));

        if (!student.getCode().equals(request.code()) && studentRepository.existsByCode(request.code())) {
            throw new BusinessRuleException(ErrorCode.STUDENT_CODE_TAKEN, request.code());
        }
        return toResponse(studentRepository.save(buildStudent(student, request, request.code())));
    }

    @Transactional
    @CacheEvict(value = "students", key = TENANT_KEY)
    public StudentResponse uploadPhoto(Long id, MultipartFile file) {
        validateImageFile(file);
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Student", id));
        // Upload the new photo first; only delete the old one once the new URL is persisted, so a
        // failed upload can't leave the student pointing at a deleted file.
        String oldPhotoUrl = student.getPhotoUrl();
        String folder = "students/" + TenantContext.getCurrentTenant() + "/" + id;
        student.setPhotoUrl(storageService.upload(folder, file));
        StudentResponse response = toResponse(studentRepository.save(student));
        if (oldPhotoUrl != null) {
            try {
                storageService.delete(oldPhotoUrl);
            } catch (Exception e) {
                // Old file orphaned but the student is consistent; don't fail the request.
                log.warn("Failed to delete old photo {}", oldPhotoUrl, e);
            }
        }
        return response;
    }

    @Transactional
    @CacheEvict(value = "students", key = TENANT_KEY)
    public StudentResponse changeStatus(Long id, StudentStatus newStatus) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Student", id));
        switch (newStatus) {
            case INACTIVE -> student.deactivate();
            case ACTIVE -> student.activate();
            case TRANSFERRED -> student.transfer();
        }
        return toResponse(studentRepository.save(student));
    }

    @Transactional
    public FamilyResponse createFamily(FamilyRequest request) {
        Family family = new Family();
        family.setGuardianName(request.guardianName());
        family.setGuardianEmail(request.guardianEmail());
        family.setGuardianPhone(request.guardianPhone());
        family.setAddress(request.address());
        family.setEmergencyContact(request.emergencyContact());
        family.setEmergencyPhone(request.emergencyPhone());
        return studentMapper.toFamilyResponse(familyRepository.save(family));
    }

    public FamilyResponse findFamilyById(Long id) {
        return familyRepository.findById(id)
                .map(studentMapper::toFamilyResponse)
                .orElseThrow(() -> new EntityNotFoundException("Family", id));
    }

    @Transactional
    public FamilyResponse updateFamily(Long id, FamilyRequest request) {
        Family family = familyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Family", id));
        family.setGuardianName(request.guardianName());
        family.setGuardianEmail(request.guardianEmail());
        family.setGuardianPhone(request.guardianPhone());
        family.setAddress(request.address());
        family.setEmergencyContact(request.emergencyContact());
        family.setEmergencyPhone(request.emergencyPhone());
        return studentMapper.toFamilyResponse(familyRepository.save(family));
    }

    private StudentResponse toResponse(Student student) {
        StudentResponse r = studentMapper.toResponse(student);
        if (r.photoUrl() == null) return r;
        String key = r.photoUrl();
        String thumbKey = S3StorageService.isLegacyKey(key) ? key : key + "_thumb.jpg";
        String thumbUrl = storageService.presign(thumbKey, PHOTO_PRESIGN_TTL);
        return new StudentResponse(r.id(), r.code(), r.firstName(), r.lastName(), r.fullName(),
                r.birthDate(), r.gender(), r.status(), r.familyId(), r.guardianName(), thumbUrl);
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessRuleException(ErrorCode.PHOTO_EMPTY);
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new BusinessRuleException(ErrorCode.PHOTO_INVALID_FORMAT);
        }
        if (file.getSize() > MAX_PHOTO_BYTES) {
            throw new BusinessRuleException(ErrorCode.PHOTO_TOO_LARGE);
        }
    }

    private Student buildStudent(Student student, StudentRequest request, String code) {
        student.setCode(code);
        student.setFirstName(request.firstName());
        student.setLastName(request.lastName());
        student.setBirthDate(request.birthDate());
        student.setGender(request.gender());
        student.setPhotoUrl(request.photoUrl());
        if (request.familyId() != null) {
            Family family = familyRepository.findById(request.familyId())
                    .orElseThrow(() -> new EntityNotFoundException("Family", request.familyId()));
            student.setFamily(family);
        }
        return student;
    }
}
