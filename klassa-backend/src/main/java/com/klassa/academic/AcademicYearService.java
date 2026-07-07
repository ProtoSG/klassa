package com.klassa.academic;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.academic.dto.AcademicYearRequest;
import com.klassa.academic.dto.AcademicYearResponse;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AcademicYearService {

    private final AcademicYearRepository academicYearRepository;
    private final AcademicMapper academicMapper;
    private final JdbcTemplate jdbcTemplate;

    public AcademicYearService(AcademicYearRepository academicYearRepository,
                               AcademicMapper academicMapper,
                               JdbcTemplate jdbcTemplate) {
        this.academicYearRepository = academicYearRepository;
        this.academicMapper = academicMapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public AcademicYearResponse create(AcademicYearRequest request) {
        if (request.endDate().isBefore(request.startDate()) ||
                request.endDate().isEqual(request.startDate())) {
            throw new BusinessRuleException(ErrorCode.ACADEMIC_YEAR_INVALID_DATES);
        }
        AcademicYear year = new AcademicYear();
        year.setName(request.name());
        year.setStartDate(request.startDate());
        year.setEndDate(request.endDate());
        year.setActive(false);
        return academicMapper.toAcademicYearResponse(academicYearRepository.save(year));
    }

    public List<AcademicYearResponse> findAll() {
        return academicYearRepository.findAllByOrderByStartDateDesc().stream()
                .map(academicMapper::toAcademicYearResponse)
                .toList();
    }

    public AcademicYearResponse findById(Long id) {
        return academicYearRepository.findById(id)
                .map(academicMapper::toAcademicYearResponse)
                .orElseThrow(() -> new EntityNotFoundException("AcademicYear", id));
    }

    @Transactional
    public AcademicYearResponse activate(Long id) {
        AcademicYear target = academicYearRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AcademicYear", id));

        // Deactivate current active year. saveAndFlush forces the active=false UPDATE to hit the
        // DB before we activate the target, so the partial unique index (one active year) never
        // sees two active rows within the flush.
        academicYearRepository.findByActiveTrue()
                .filter(current -> !current.getId().equals(id))
                .ifPresent(current -> {
                    current.setActive(false);
                    academicYearRepository.saveAndFlush(current);
                });

        target.activate();
        return academicMapper.toAcademicYearResponse(academicYearRepository.save(target));
    }

    @Transactional
    public void close(Long id, String performedBy) {
        AcademicYear year = academicYearRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AcademicYear", id));
        year.assertCanClose();
        jdbcTemplate.update("CALL sp_close_academic_year(?, ?)", id, performedBy);
    }
}
