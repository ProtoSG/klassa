package com.klassa.billing;

import com.klassa.billing.dto.InvoiceResponse;
import com.klassa.billing.dto.PaymentRequest;
import com.klassa.billing.dto.PaymentResponse;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.security.SecurityUser;
import com.klassa.user.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final BillingMapper billingMapper;
    private final InvoiceService invoiceService;

    public PaymentService(PaymentRepository paymentRepository,
                          InvoiceRepository invoiceRepository,
                          UserRepository userRepository,
                          BillingMapper billingMapper,
                          InvoiceService invoiceService) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
        this.billingMapper = billingMapper;
        this.invoiceService = invoiceService;
    }

    @Transactional
    public PaymentResult registerPayment(PaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(request.invoiceId())
                .orElseThrow(() -> new EntityNotFoundException("Invoice", request.invoiceId()));

        return switch (invoice.getStatus()) {
            case PAID -> new PaymentResult.AlreadyPaid(invoice.getInvoiceNumber());
            case CANCELLED -> new PaymentResult.Cancelled(invoice.getInvoiceNumber());
            case PENDING, OVERDUE, PARTIAL -> processPayment(invoice, request);
        };
    }

    private PaymentResult.Success processPayment(Invoice invoice, PaymentRequest request) {
        BigDecimal alreadyPaid = paymentRepository.sumAmountByInvoiceId(invoice.getId());

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(request.amount());
        payment.setPaymentDate(request.paymentDate());
        payment.setMethod(request.method());
        payment.setReceiptNumber(request.receiptNumber());
        payment.setNotes(request.notes());

        Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .map(auth -> (SecurityUser) auth.getPrincipal())
                .flatMap(su -> userRepository.findById(su.userId()))
                .ifPresent(payment::setRegisteredBy);

        Payment saved = paymentRepository.save(payment);

        invoice.applyPayment(request.amount(), alreadyPaid);
        Invoice updatedInvoice = invoiceRepository.save(invoice);

        PaymentResponse paymentResponse = billingMapper.toPaymentResponse(saved);
        InvoiceResponse invoiceResponse = invoiceService.toResponse(updatedInvoice);
        return new PaymentResult.Success(paymentResponse, invoiceResponse);
    }

    public List<PaymentResponse> findByInvoice(Long invoiceId) {
        return paymentRepository.findAllByInvoiceId(invoiceId).stream()
                .map(billingMapper::toPaymentResponse)
                .toList();
    }
}
