package com.klassa.billing;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findAllByStudentId(Long studentId);

    Page<Invoice> findAllByStudentId(Long studentId, Pageable pageable);

    List<Invoice> findAllByStudentIdAndStatus(Long studentId, InvoiceStatus status);

    Page<Invoice> findAllByStudentIdAndStatus(Long studentId, InvoiceStatus status, Pageable pageable);

    List<Invoice> findAllByStatus(InvoiceStatus status);

    List<Invoice> findAllByDueDateBeforeAndStatusIn(LocalDate date, List<InvoiceStatus> statuses);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Invoice i " +
           "WHERE i.student.id = :studentId AND i.status IN ('PENDING', 'OVERDUE', 'PARTIAL')")
    BigDecimal sumPendingBalanceByStudentId(Long studentId);
}
