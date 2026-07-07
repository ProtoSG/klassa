package com.klassa.billing;

import com.klassa.billing.dto.InvoiceResponse;
import com.klassa.billing.dto.PaymentResponse;

public sealed interface PaymentResult
        permits PaymentResult.Success, PaymentResult.AlreadyPaid, PaymentResult.Cancelled {

    record Success(PaymentResponse payment, InvoiceResponse updatedInvoice) implements PaymentResult {}

    record AlreadyPaid(String invoiceNumber) implements PaymentResult {}

    record Cancelled(String invoiceNumber) implements PaymentResult {}
}
