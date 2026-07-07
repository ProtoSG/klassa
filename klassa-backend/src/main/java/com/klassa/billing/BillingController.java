package com.klassa.billing;

import com.klassa.billing.dto.*;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.security.SecurityUser;
import com.klassa.shared.web.ApiResponse;
import com.klassa.shared.web.PageResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/billing")
@Tag(name = "Billing")
@SecurityRequirement(name = "bearerAuth")
public class BillingController {

    private final FeeScheduleService feeScheduleService;
    private final InvoiceService invoiceService;
    private final PaymentService paymentService;

    public BillingController(FeeScheduleService feeScheduleService,
                             InvoiceService invoiceService,
                             PaymentService paymentService) {
        this.feeScheduleService = feeScheduleService;
        this.invoiceService = invoiceService;
        this.paymentService = paymentService;
    }

    // ─── Fee Schedules ────────────────────────────────────────────────────────

    @PostMapping("/fee-schedules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FeeScheduleResponse>> createFeeSchedule(
            @Valid @RequestBody FeeScheduleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(feeScheduleService.create(request)));
    }

    @GetMapping("/fee-schedules")
    public ResponseEntity<ApiResponse<List<FeeScheduleResponse>>> findFeeSchedules(
            @RequestParam Long academicYearId) {
        return ResponseEntity.ok(ApiResponse.ok(feeScheduleService.findByAcademicYear(academicYearId)));
    }

    @DeleteMapping("/fee-schedules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FeeScheduleResponse>> deactivateFeeSchedule(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(feeScheduleService.deactivate(id)));
    }

    // ─── Invoices ─────────────────────────────────────────────────────────────

    @PostMapping("/invoices")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TREASURER')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @Valid @RequestBody InvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(invoiceService.create(request)));
    }

    @PostMapping("/invoices/generate-monthly")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TREASURER')")
    public ResponseEntity<Void> generateMonthly(
            @Valid @RequestBody GenerateInvoicesRequest request,
            @AuthenticationPrincipal SecurityUser principal) {
        invoiceService.generateMonthly(request, principal.email());
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/invoices/student/{studentId}")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> findInvoicesByStudent(
            @PathVariable Long studentId,
            @RequestParam(required = false) InvoiceStatus status,
            @PageableDefault(size = 12, sort = "dueDate", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<InvoiceResponse> result = status != null
                ? invoiceService.findByStudentAndStatusPaged(studentId, status, pageable)
                : invoiceService.findByStudentPaged(studentId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> findInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.findById(id)));
    }

    @GetMapping("/invoices/student/{studentId}/balance")
    public ResponseEntity<ApiResponse<BigDecimal>> getPendingBalance(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getPendingBalance(studentId)));
    }

    @PostMapping("/invoices/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TREASURER')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.cancel(id)));
    }

    // ─── Payments ─────────────────────────────────────────────────────────────

    @PostMapping("/payments")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TREASURER')")
    public ResponseEntity<ApiResponse<?>> registerPayment(
            @Valid @RequestBody PaymentRequest request) {
        PaymentResult result = paymentService.registerPayment(request);
        return switch (result) {
            case PaymentResult.Success s -> ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.created(s));
            case PaymentResult.AlreadyPaid ap -> throw new BusinessRuleException(
                    ErrorCode.INVOICE_ALREADY_PAID, ap.invoiceNumber());
            case PaymentResult.Cancelled c -> throw new BusinessRuleException(
                    ErrorCode.INVOICE_CANCELLED, c.invoiceNumber());
        };
    }

    @GetMapping("/payments/invoice/{invoiceId}")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> findPaymentsByInvoice(
            @PathVariable Long invoiceId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.findByInvoice(invoiceId)));
    }
}
