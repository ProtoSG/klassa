package com.klassa.billing;

import com.klassa.billing.dto.GenerateInvoicesRequest;
import com.klassa.billing.dto.InvoiceRequest;
import com.klassa.billing.dto.InvoiceResponse;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.web.PageResponse;
import com.klassa.student.Student;
import com.klassa.student.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final FeeScheduleRepository feeScheduleRepository;
    private final StudentRepository studentRepository;
    private final PaymentRepository paymentRepository;
    private final JdbcTemplate jdbcTemplate;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          FeeScheduleRepository feeScheduleRepository,
                          StudentRepository studentRepository,
                          PaymentRepository paymentRepository,
                          JdbcTemplate jdbcTemplate) {
        this.invoiceRepository = invoiceRepository;
        this.feeScheduleRepository = feeScheduleRepository;
        this.studentRepository = studentRepository;
        this.paymentRepository = paymentRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public InvoiceResponse create(InvoiceRequest request) {
        Student student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> new EntityNotFoundException("Student", request.studentId()));

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setStudent(student);
        invoice.setConcept(request.concept());
        invoice.setAmount(request.amount());
        invoice.setDueDate(request.dueDate());
        invoice.setStatus(InvoiceStatus.PENDING);

        if (request.feeScheduleId() != null) {
            invoice.setFeeSchedule(feeScheduleRepository.findById(request.feeScheduleId())
                    .orElseThrow(() -> new EntityNotFoundException("FeeSchedule", request.feeScheduleId())));
        }

        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public void generateMonthly(GenerateInvoicesRequest request, String performedBy) {
        jdbcTemplate.update("CALL sp_generate_monthly_invoices(?, ?, ?, ?)",
                request.academicYearId(), request.feeScheduleId(),
                java.sql.Date.valueOf(request.dueDate()), performedBy);
    }

    public List<InvoiceResponse> findByStudent(Long studentId) {
        return toResponses(invoiceRepository.findAllByStudentId(studentId));
    }

    public PageResponse<InvoiceResponse> findByStudentPaged(Long studentId, Pageable pageable) {
        return toPageResponse(invoiceRepository.findAllByStudentId(studentId, pageable));
    }

    public List<InvoiceResponse> findByStudentAndStatus(Long studentId, InvoiceStatus status) {
        return toResponses(invoiceRepository.findAllByStudentIdAndStatus(studentId, status));
    }

    public PageResponse<InvoiceResponse> findByStudentAndStatusPaged(Long studentId, InvoiceStatus status, Pageable pageable) {
        return toPageResponse(invoiceRepository.findAllByStudentIdAndStatus(studentId, status, pageable));
    }

    public InvoiceResponse findById(Long id) {
        return invoiceRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", id));
    }

    public BigDecimal getPendingBalance(Long studentId) {
        return invoiceRepository.sumPendingBalanceByStudentId(studentId);
    }

    @Transactional
    public InvoiceResponse cancel(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", id));
        invoice.cancel();
        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public void markOverdue() {
        List<Invoice> overdue = invoiceRepository.findAllByDueDateBeforeAndStatusIn(
                LocalDate.now(), List.of(InvoiceStatus.PENDING, InvoiceStatus.PARTIAL));
        overdue.forEach(Invoice::markOverdue);
        invoiceRepository.saveAll(overdue);
    }

    // Single-invoice path (create, findById, cancel, payments): one sum query.
    InvoiceResponse toResponse(Invoice invoice) {
        return toResponse(invoice, paymentRepository.sumAmountByInvoiceId(invoice.getId()));
    }

    private InvoiceResponse toResponse(Invoice invoice, BigDecimal paid) {
        BigDecimal pending = invoice.getAmount().subtract(paid).max(BigDecimal.ZERO);
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getStudent().getId(),
                invoice.getStudent().fullName(),
                invoice.getFeeSchedule() != null ? invoice.getFeeSchedule().getId() : null,
                invoice.getConcept(),
                invoice.getAmount(),
                paid,
                pending,
                invoice.getDueDate(),
                invoice.getStatus()
        );
    }

    // Batch path (lists/pages): one grouped sum query for the whole page, no N+1.
    private List<InvoiceResponse> toResponses(List<Invoice> invoices) {
        Map<Long, BigDecimal> paidByInvoice = paidAmounts(invoices);
        return invoices.stream()
                .map(inv -> toResponse(inv, paidByInvoice.getOrDefault(inv.getId(), BigDecimal.ZERO)))
                .toList();
    }

    private PageResponse<InvoiceResponse> toPageResponse(Page<Invoice> page) {
        Map<Long, BigDecimal> paidByInvoice = paidAmounts(page.getContent());
        return PageResponse.of(page.map(
                inv -> toResponse(inv, paidByInvoice.getOrDefault(inv.getId(), BigDecimal.ZERO))));
    }

    private Map<Long, BigDecimal> paidAmounts(List<Invoice> invoices) {
        if (invoices.isEmpty()) return Map.of();
        List<Long> ids = invoices.stream().map(Invoice::getId).toList();
        Map<Long, BigDecimal> map = new HashMap<>();
        for (Object[] row : paymentRepository.sumAmountGroupedByInvoiceId(ids)) {
            map.put((Long) row[0], (BigDecimal) row[1]);
        }
        return map;
    }

    private String generateInvoiceNumber() {
        return "INV-" + System.currentTimeMillis() + "-" +
                UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
