package com.klassa.billing;

import com.klassa.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InvoiceTest {

    private Invoice invoice(BigDecimal amount, InvoiceStatus status) {
        Invoice i = new Invoice();
        i.setAmount(amount);
        i.setDueDate(LocalDate.now().plusDays(10));
        i.setStatus(status);
        return i;
    }

    @Test
    void applyPayment_partial_setsPartial() {
        Invoice i = invoice(new BigDecimal("100.00"), InvoiceStatus.PENDING);
        i.applyPayment(new BigDecimal("40.00"), BigDecimal.ZERO);
        assertThat(i.getStatus()).isEqualTo(InvoiceStatus.PARTIAL);
    }

    @Test
    void applyPayment_exact_setsPaid() {
        Invoice i = invoice(new BigDecimal("100.00"), InvoiceStatus.PENDING);
        i.applyPayment(new BigDecimal("100.00"), BigDecimal.ZERO);
        assertThat(i.getStatus()).isEqualTo(InvoiceStatus.PAID);
    }

    @Test
    void applyPayment_completingRemainder_setsPaid() {
        Invoice i = invoice(new BigDecimal("100.00"), InvoiceStatus.PARTIAL);
        i.applyPayment(new BigDecimal("60.00"), new BigDecimal("40.00"));
        assertThat(i.getStatus()).isEqualTo(InvoiceStatus.PAID);
    }

    @Test
    void applyPayment_exceedingBalance_throws() {
        Invoice i = invoice(new BigDecimal("100.00"), InvoiceStatus.PENDING);
        assertThatThrownBy(() -> i.applyPayment(new BigDecimal("150.00"), BigDecimal.ZERO))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("supera el saldo");
    }

    @Test
    void applyPayment_onPaidInvoice_throws() {
        Invoice i = invoice(new BigDecimal("100.00"), InvoiceStatus.PAID);
        assertThatThrownBy(() -> i.applyPayment(new BigDecimal("10.00"), new BigDecimal("100.00")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("PAID");
    }

    @Test
    void applyPayment_onCancelledInvoice_throws() {
        Invoice i = invoice(new BigDecimal("100.00"), InvoiceStatus.CANCELLED);
        assertThatThrownBy(() -> i.applyPayment(new BigDecimal("10.00"), BigDecimal.ZERO))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("CANCELLED");
    }

    @Test
    void cancel_paidInvoice_throws() {
        Invoice i = invoice(new BigDecimal("100.00"), InvoiceStatus.PAID);
        assertThatThrownBy(i::cancel)
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("pagada");
    }

    @Test
    void cancel_pendingInvoice_setsCancelled() {
        Invoice i = invoice(new BigDecimal("100.00"), InvoiceStatus.PENDING);
        i.cancel();
        assertThat(i.getStatus()).isEqualTo(InvoiceStatus.CANCELLED);
    }

    @Test
    void markOverdue_pendingPastDue_setsOverdue() {
        Invoice i = invoice(new BigDecimal("100.00"), InvoiceStatus.PENDING);
        i.setDueDate(LocalDate.now().minusDays(1));
        i.markOverdue();
        assertThat(i.getStatus()).isEqualTo(InvoiceStatus.OVERDUE);
    }

    @Test
    void markOverdue_pendingNotYetDue_staysPending() {
        Invoice i = invoice(new BigDecimal("100.00"), InvoiceStatus.PENDING);
        i.setDueDate(LocalDate.now().plusDays(5));
        i.markOverdue();
        assertThat(i.getStatus()).isEqualTo(InvoiceStatus.PENDING);
    }

    @Test
    void markOverdue_paidPastDue_staysPaid() {
        Invoice i = invoice(new BigDecimal("100.00"), InvoiceStatus.PAID);
        i.setDueDate(LocalDate.now().minusDays(1));
        i.markOverdue();
        assertThat(i.getStatus()).isEqualTo(InvoiceStatus.PAID);
    }
}
