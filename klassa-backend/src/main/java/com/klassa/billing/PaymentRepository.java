package com.klassa.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByInvoiceId(Long invoiceId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoice.id = :invoiceId")
    BigDecimal sumAmountByInvoiceId(Long invoiceId);

    @Query("SELECT p.invoice.id, COALESCE(SUM(p.amount), 0) FROM Payment p " +
            "WHERE p.invoice.id IN :ids GROUP BY p.invoice.id")
    List<Object[]> sumAmountGroupedByInvoiceId(List<Long> ids);
}
