package com.klassa.student;

import com.klassa.plan.PlanFeatures;
import com.klassa.plan.PlanService;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.multitenancy.TenantContext;
import com.klassa.shared.security.SecurityUser;
import com.klassa.shared.storage.S3StorageService;
import com.klassa.shared.storage.StorageService;
import com.klassa.shared.web.PageResponse;
import com.klassa.student.dto.FamilyRequest;
import com.klassa.student.dto.FamilyResponse;
import com.klassa.student.dto.ImportResult;
import com.klassa.student.dto.ImportRowError;
import com.klassa.student.dto.StudentRequest;
import com.klassa.student.dto.StudentResponse;
import com.klassa.user.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Transactional(readOnly = true)
public class StudentService {

    private static final Logger log = LoggerFactory.getLogger(StudentService.class);
    private static final List<String> ALLOWED_IMAGE_TYPES = List.of("image/jpeg", "image/png");
    private static final long MAX_PHOTO_BYTES = 5L * 1024 * 1024;
    private static final Duration PHOTO_PRESIGN_TTL = Duration.ofHours(1);

    private static final List<String> ALLOWED_IMPORT_TYPES =
            List.of("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    private static final int MAX_IMPORT_ROWS = 2000;
    private static final List<String> EXPECTED_IMPORT_HEADERS =
            List.of("Nombres", "Apellidos", "Fecha de nacimiento", "Sexo (M/F)");

    private final StudentRepository studentRepository;
    private final FamilyRepository familyRepository;
    private final StudentMapper studentMapper;
    private final StorageService storageService;
    private final StudentCodeGenerator studentCodeGenerator;
    private final StudentImportService studentImportService;
    private final PlanService planService;
    private final StudentImportRowParser importRowParser = new StudentImportRowParser();

    public StudentService(StudentRepository studentRepository, FamilyRepository familyRepository,
                          StudentMapper studentMapper, StorageService storageService,
                          StudentCodeGenerator studentCodeGenerator, StudentImportService studentImportService,
                          PlanService planService) {
        this.studentRepository = studentRepository;
        this.familyRepository = familyRepository;
        this.studentMapper = studentMapper;
        this.storageService = storageService;
        this.studentCodeGenerator = studentCodeGenerator;
        this.studentImportService = studentImportService;
        this.planService = planService;
    }

    // Redis cache is shared across tenants, but entity ids are only unique per tenant schema.
    // Prefix every key with the current tenant so tenant A's id=1 can't read tenant B's id=1.
    private static final String TENANT_KEY =
            "T(com.klassa.shared.multitenancy.TenantContext).getCurrentTenant() + ':' + #id";

    @Transactional
    @CacheEvict(value = "students", allEntries = true)
    public StudentResponse create(StudentRequest request) {
        enforceStudentLimit();
        String code = request.code();
        if (code == null || code.isBlank()) {
            code = studentCodeGenerator.nextCode();
        } else if (studentRepository.existsByCode(code)) {
            throw new BusinessRuleException(ErrorCode.STUDENT_CODE_TAKEN, code);
        }
        Student student = buildStudent(new Student(), request);
        student.setCode(code);
        return toResponse(studentRepository.save(student));
    }

    /**
     * Enforces the {@code plans.max_students} cap (or {@code features.maxStudents} if set) for
     * the current tenant. Called by {@link #create} and {@link #importStudents} before any
     * row is persisted. Throws {@link ErrorCode#STUDENT_LIMIT_REACHED} when the tenant is at
     * or over the cap.
     *
     * <p>Not transactionally locked against concurrent creates — two simultaneous requests
     * could each pass the check and both insert, briefly overshooting the cap by one. The
     * {@code plans.features} JSONB is a soft commercial limit, not a hard integrity
     * constraint; if it ever needs to be airtight, pair with a row-level lock on the tenant
     * or a SELECT … FOR UPDATE on the count.
     */
    private void enforceStudentLimit() {
        PlanFeatures features = planService.getCurrentFeatures();
        long active = studentRepository.countByStatus(StudentStatus.ACTIVE);
        if (!features.canAddMoreStudents((int) active)) {
            throw new BusinessRuleException(ErrorCode.STUDENT_LIMIT_REACHED, features.maxStudents());
        }
    }

    // No @Transactional here on purpose: each row is persisted through studentImportService's own
    // REQUIRES_NEW transaction (see StudentImportService), so one bad row never rolls back rows
    // already committed earlier in the same file. "empty file" (zero data rows) can only be known
    // once the whole stream has been read.
    //
    // The sheet is read with StudentImportSheetReader's SAX/streaming API rather than a DOM
    // XSSFWorkbook: rows are handed to the callback below one at a time and never accumulated, so
    // a small-but-highly-compressible file can't balloon into a huge in-memory object graph.
    //
    // Two-phase on purpose: since every row commits immediately in its own transaction as it
    // streams in, checking the row-count cap *while* persisting would mean a file with (say) 2100
    // rows commits 2000 students before the 2001st row trips the cap and the request fails --
    // leaving an admin staring at an error that says the whole import failed despite 2000 new
    // students existing. Phase 1 streams the file purely to validate the header and enforce the
    // cap (throwing before touching the database at all); phase 2 -- reached only if phase 1
    // didn't throw -- re-reads the file (MultipartFile#getInputStream() is safe to call more than
    // once; Spring's multipart abstraction backs it with a temp file/byte buffer) and actually
    // parses + persists each row exactly as before.
    @CacheEvict(value = "students", allEntries = true)
    public ImportResult importStudents(MultipartFile file) {
        validateImportFile(file);

        // Reject the whole import upfront if the tenant is already at its plan cap. Phase 2
        // below persists row-by-row in its own transaction, so checking mid-import would mean
        // partial commits followed by an error — and the user would rather know the import is
        // impossible before any DB writes than after 50 already committed.
        PlanFeatures features = planService.getCurrentFeatures();
        long active = studentRepository.countByStatus(StudentStatus.ACTIVE);
        if (!features.isUnlimitedStudents() && active >= features.maxStudents()) {
            throw new BusinessRuleException(ErrorCode.STUDENT_LIMIT_REACHED, features.maxStudents());
        }

        StudentImportSheetReader reader = new StudentImportSheetReader(EXPECTED_IMPORT_HEADERS, MAX_IMPORT_ROWS);

        try {
            reader.validate(file);
        } catch (ImportRowLimitExceededException e) {
            throw new BusinessRuleException(ErrorCode.IMPORT_TOO_MANY_ROWS, MAX_IMPORT_ROWS);
        } catch (ImportFileUnreadableException e) {
            throw new BusinessRuleException(ErrorCode.IMPORT_UNREADABLE_FILE);
        }

        AtomicInteger totalRows = new AtomicInteger();
        AtomicInteger successCount = new AtomicInteger();
        List<ImportRowError> errors = new ArrayList<>();

        try {
            reader.read(file, row -> {
                if (isImportRowBlank(row)) {
                    return;
                }
                totalRows.incrementAndGet();
                try {
                    StudentImportRowParser.ParsedRow parsed = importRowParser.parse(row);
                    studentImportService.importRow(parsed);
                    successCount.incrementAndGet();
                } catch (RowValidationException e) {
                    errors.addAll(e.getErrors());
                } catch (DataIntegrityViolationException e) {
                    log.warn("Data integrity violation importing student row {}", row.rowNumber(), e);
                    errors.add(new ImportRowError(row.rowNumber(), "", "Conflicto de datos al guardar la fila"));
                }
            });
        } catch (ImportRowLimitExceededException e) {
            // Defensive only: phase 1 above already validated the row count against the same
            // header/file, so this should be unreachable in practice.
            throw new BusinessRuleException(ErrorCode.IMPORT_TOO_MANY_ROWS, MAX_IMPORT_ROWS);
        } catch (ImportFileUnreadableException e) {
            throw new BusinessRuleException(ErrorCode.IMPORT_UNREADABLE_FILE);
        }

        if (totalRows.get() == 0) {
            throw new BusinessRuleException(ErrorCode.IMPORT_EMPTY_FILE);
        }
        return new ImportResult(totalRows.get(), successCount.get(), errors.size(), errors);
    }

    @Cacheable(value = "students", key = TENANT_KEY)
    public StudentResponse findById(Long id) {
        return studentRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Student", id));
    }

    // TEACHER only sees students with an active enrollment in one of their own sections (homeroom
    // or teaching-assignment); ADMIN/TREASURER see the full tenant roster.
    public PageResponse<StudentResponse> search(StudentStatus status, String search, SecurityUser principal,
                                                Pageable pageable) {
        Long teacherId = principal != null && principal.role() == UserRole.TEACHER ? principal.userId() : null;
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();
        return PageResponse.of(
                studentRepository.search(status, normalizedSearch, teacherId, pageable).map(this::toResponse));
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

        return toResponse(studentRepository.save(buildStudent(student, request)));
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

    public FamilyResponse findMyFamily(Long guardianUserId) {
        return studentMapper.toFamilyResponse(resolveMyFamily(guardianUserId));
    }

    public List<StudentResponse> findMyChildren(Long guardianUserId) {
        return findByFamily(resolveMyFamily(guardianUserId).getId());
    }

    private Family resolveMyFamily(Long guardianUserId) {
        return familyRepository.findByGuardianUserId(guardianUserId)
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.FAMILY_NOT_LINKED));
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
                r.birthDate(), r.gender(), r.status(), r.familyId(),
                r.guardianName(), r.guardianPhone(), thumbUrl);
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

    private void validateImportFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessRuleException(ErrorCode.IMPORT_EMPTY_FILE);
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMPORT_TYPES.contains(contentType)) {
            throw new BusinessRuleException(ErrorCode.IMPORT_INVALID_FORMAT);
        }
    }

    // A data row counts as blank (and is skipped without affecting totalRows/successCount) only
    // when every one of the 4 template columns has neither text nor a resolved Excel date.
    private boolean isImportRowBlank(RawImportRow row) {
        for (int i = 0; i < RawImportRow.COLUMN_COUNT; i++) {
            RawImportRow.RawCell cell = row.cell(i);
            if (cell.excelDate() != null) return false;
            String text = cell.text();
            if (text != null && !text.isBlank()) return false;
        }
        return true;
    }

    private Student buildStudent(Student student, StudentRequest request) {
        student.setFirstName(request.firstName());
        student.setLastName(request.lastName());
        student.setBirthDate(request.birthDate());
        student.setGender(request.gender());
        // photoUrl is deliberately NOT set from the request here. StudentResponse.photoUrl is
        // always a presigned URL (see toResponse), never the raw storage key — a client that
        // round-trips a fetched StudentResponse back into an update request (EditStudentDialog,
        // LinkExistingFamilyDialog) would otherwise persist that presigned URL as if it were the
        // key, and the next read presigns *that*, producing a nested double-presigned URL that
        // 400s. uploadPhoto() is the only path allowed to set photoUrl — it always writes the raw
        // key returned by storageService.upload(), never something read back from a response DTO.
        if (request.familyId() != null) {
            Family family = familyRepository.findById(request.familyId())
                    .orElseThrow(() -> new EntityNotFoundException("Family", request.familyId()));
            student.setFamily(family);
        }
        return student;
    }
}
