package com.klassa.billing;

import com.klassa.academic.AcademicYear;
import com.klassa.academic.AcademicYearRepository;
import com.klassa.billing.dto.FeeScheduleRequest;
import com.klassa.billing.dto.FeeScheduleResponse;
import com.klassa.shared.domain.vo.DueDay;
import com.klassa.shared.exception.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class FeeScheduleService {

    private final FeeScheduleRepository feeScheduleRepository;
    private final AcademicYearRepository academicYearRepository;
    private final BillingMapper billingMapper;

    public FeeScheduleService(FeeScheduleRepository feeScheduleRepository,
                               AcademicYearRepository academicYearRepository,
                               BillingMapper billingMapper) {
        this.feeScheduleRepository = feeScheduleRepository;
        this.academicYearRepository = academicYearRepository;
        this.billingMapper = billingMapper;
    }

    @Transactional
    public FeeScheduleResponse create(FeeScheduleRequest request) {
        AcademicYear year = academicYearRepository.findById(request.academicYearId())
                .orElseThrow(() -> new EntityNotFoundException("AcademicYear", request.academicYearId()));

        FeeSchedule fs = new FeeSchedule();
        fs.setConcept(request.concept());
        fs.setAmount(request.amount());
        fs.setDueDay(new DueDay(request.dueDay()));
        fs.setAcademicYear(year);
        fs.setActive(true);
        return billingMapper.toFeeScheduleResponse(feeScheduleRepository.save(fs));
    }

    public List<FeeScheduleResponse> findByAcademicYear(Long academicYearId) {
        return feeScheduleRepository.findAllByAcademicYearId(academicYearId).stream()
                .map(billingMapper::toFeeScheduleResponse)
                .toList();
    }

    public FeeScheduleResponse findById(Long id) {
        return feeScheduleRepository.findById(id)
                .map(billingMapper::toFeeScheduleResponse)
                .orElseThrow(() -> new EntityNotFoundException("FeeSchedule", id));
    }

    @Transactional
    public FeeScheduleResponse deactivate(Long id) {
        FeeSchedule fs = feeScheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("FeeSchedule", id));
        fs.setActive(false);
        return billingMapper.toFeeScheduleResponse(feeScheduleRepository.save(fs));
    }
}
