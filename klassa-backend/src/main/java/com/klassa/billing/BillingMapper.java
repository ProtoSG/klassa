package com.klassa.billing;

import com.klassa.billing.dto.FeeScheduleResponse;
import com.klassa.billing.dto.PaymentResponse;
import com.klassa.shared.domain.vo.DueDay;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface BillingMapper {

    @Mapping(target = "academicYearId", source = "academicYear.id")
    @Mapping(target = "academicYearName", source = "academicYear.name")
    @Mapping(target = "dueDay", expression = "java(feeSchedule.getDueDay() != null ? feeSchedule.getDueDay().value() : null)")
    FeeScheduleResponse toFeeScheduleResponse(FeeSchedule feeSchedule);

    default Integer dueDayToInteger(DueDay dueDay) {
        return dueDay != null ? dueDay.value() : null;
    }

    @Mapping(target = "invoiceId", source = "invoice.id")
    @Mapping(target = "invoiceNumber", source = "invoice.invoiceNumber")
    @Mapping(target = "registeredById", source = "registeredBy.id")
    PaymentResponse toPaymentResponse(Payment payment);
}
