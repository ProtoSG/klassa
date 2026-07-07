package com.klassa.billing;

import com.klassa.shared.domain.BaseEntity;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.student.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
public class Invoice extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fee_schedule_id")
    private FeeSchedule feeSchedule;

    @Column(nullable = false, length = 200)
    private String concept;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false, columnDefinition = "invoice_status")
    private InvoiceStatus status = InvoiceStatus.PENDING;

    @Version
    @Column(nullable = false)
    private Long version;

    public void applyPayment(BigDecimal paymentAmount, BigDecimal totalPaidSoFar) {
        if (status == InvoiceStatus.PAID || status == InvoiceStatus.CANCELLED)
            throw new BusinessRuleException(ErrorCode.INVOICE_NOT_PAYABLE, status);
        BigDecimal pending = amount.subtract(totalPaidSoFar).max(BigDecimal.ZERO);
        if (paymentAmount.compareTo(pending) > 0)
            throw new BusinessRuleException(ErrorCode.PAYMENT_EXCEEDS_BALANCE, paymentAmount, pending);
        BigDecimal newTotal = totalPaidSoFar.add(paymentAmount);
        this.status = newTotal.compareTo(amount) >= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;
    }

    public void cancel() {
        if (status == InvoiceStatus.PAID)
            throw new BusinessRuleException(ErrorCode.PAID_INVOICE_CANCEL);
        this.status = InvoiceStatus.CANCELLED;
    }

    public void markOverdue() {
        if (status == InvoiceStatus.PENDING && dueDate.isBefore(LocalDate.now()))
            this.status = InvoiceStatus.OVERDUE;
    }
}
