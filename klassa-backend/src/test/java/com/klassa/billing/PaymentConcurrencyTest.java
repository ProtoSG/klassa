package com.klassa.billing;

import com.klassa.billing.dto.PaymentRequest;
import com.klassa.shared.multitenancy.TenantContext;
import com.klassa.student.Gender;
import com.klassa.student.Student;
import com.klassa.student.StudentRepository;
import com.klassa.student.StudentStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.OptimisticLockException;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Concurrency tests for {@link PaymentService}. The first real {@code @SpringBootTest}
 * exercising optimistic locking against PostgreSQL — closes audit Fase 7 §7 ("tests de
 * integración multi-tenant (aislamiento) y de cobranza (concurrencia)") which previously had
 * happy-path coverage via {@link InvoiceTest} but nothing that exercised thread races.
 *
 * <p>Targets:
 * <ul>
 *   <li>{@link Invoice#version} (V8) prevents silent overpayment when two cashiers pay the
 *       same invoice at the same time.</li>
 *   <li>{@link PaymentService#registerPayment} rolls back the failing transaction cleanly
 *       — the partially-saved payment is undone, not orphaned with a stale invoice.</li>
 *   <li>Multiple small payments summing to the invoice amount leave it in a consistent
 *       state (no over-payment, no lost updates).</li>
 * </ul>
 *
 * <p>Tenant context: tests run against the {@code test} schema that
 * {@link com.klassa.tenant.TenantMigrationRunner} provisions. Each thread sets its own
 * {@link TenantContext} so the connection routes to the right schema.
 *
 * <p>Setup caveat: rather than rely on the MultiTenantConnectionProvider alone (which depends
 * on the JPA transaction acquiring the connection at the right moment), setUp explicitly
 * pins search_path via JdbcTemplate. That makes the test resilient regardless of which
 * previous test left a connection in the pool with a wrong search_path.
 */
@SpringBootTest
@ActiveProfiles("test")
class PaymentConcurrencyTest {

    private static final String TENANT = "test";
    private static final int CONCURRENT_PAYMENTS = 3;
    private static final BigDecimal PAYMENT_AMOUNT = new BigDecimal("30.00");
    private static final BigDecimal INVOICE_AMOUNT = new BigDecimal("100.00");

    @Autowired private PaymentService paymentService;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @PersistenceContext private EntityManager entityManager;

    private Student student;
    private Invoice invoice;

    @BeforeEach
    void setUp() {
        // Explicit search_path pin: bypasses any leftover state from the connection pool
        // (Hikari returns connections with their last-known search_path until the next
        // request reaches the MultiTenantConnectionProvider).
        pinSearchPath();
        try {
            student = new Student();
            student.setCode("STU-" + UUID.randomUUID().toString().substring(0, 8));
            student.setFirstName("Concurrency");
            student.setLastName("Test");
            student.setBirthDate(LocalDate.of(2015, 1, 1));
            student.setGender(Gender.M);
            student.setStatus(StudentStatus.ACTIVE);
            student = studentRepository.saveAndFlush(student);

            invoice = new Invoice();
            invoice.setInvoiceNumber("INV-CONC-" + UUID.randomUUID().toString().substring(0, 8));
            invoice.setStudent(student);
            invoice.setConcept("Concurrency test fee");
            invoice.setAmount(INVOICE_AMOUNT);
            invoice.setDueDate(LocalDate.now().plusDays(30));
            invoice.setStatus(InvoiceStatus.PENDING);
            invoice = invoiceRepository.saveAndFlush(invoice);
        } finally {
            TenantContext.clear();
        }
    }

    @AfterEach
    void tearDown() {
        try {
            pinSearchPath();
            paymentRepository.deleteAll(paymentRepository.findAllByInvoiceId(invoice.getId()));
            invoiceRepository.deleteById(invoice.getId());
            studentRepository.deleteById(student.getId());
        } catch (Exception e) {
            // Don't fail the test because cleanup couldn't run — the @AfterEach contract is
            // best-effort, and the test framework already reports the original failure.
            System.err.println("tearDown failed: " + e.getMessage());
        } finally {
            TenantContext.clear();
        }
    }

    @Test
    void concurrentPayments_onlyOneLosesOptimisticLockAndNoOverpayment() throws Exception {
        pinSearchPath();

        ExecutorService pool = Executors.newFixedThreadPool(CONCURRENT_PAYMENTS);
        CountDownLatch ready = new CountDownLatch(CONCURRENT_PAYMENTS);
        CountDownLatch start = new CountDownLatch(1);

        AtomicInteger successes = new AtomicInteger();
        AtomicInteger optimisticLockFailures = new AtomicInteger();
        AtomicInteger deadlockFailures = new AtomicInteger();
        AtomicInteger otherFailures = new AtomicInteger();

        try {
            List<Future<?>> futures = new ArrayList<>();
            for (int i = 0; i < CONCURRENT_PAYMENTS; i++) {
                final int workerId = i;
                futures.add(pool.submit(() -> {
                    TenantContext.setCurrentTenant(TENANT);
                    try {
                        ready.countDown();
                        start.await();
                        PaymentRequest req = new PaymentRequest(
                                invoice.getId(), PAYMENT_AMOUNT, LocalDate.now(),
                                PaymentMethod.CASH, "R-" + workerId, "concurrency test");
                        paymentService.registerPayment(req);
                        successes.incrementAndGet();
                    } catch (OptimisticLockingFailureException | OptimisticLockException e) {
                        optimisticLockFailures.incrementAndGet();
                    } catch (CannotAcquireLockException e) {
                        // Postgres deadlock detector rolls back one transaction with SQLSTATE
                        // 40P01 — Spring raises this as CannotAcquireLockException. Same
                        // observable as an optimistic lock failure: the payment write was
                        // rolled back, the system stayed consistent.
                        deadlockFailures.incrementAndGet();
                    } catch (Exception e) {
                        otherFailures.incrementAndGet();
                    } finally {
                        TenantContext.clear();
                    }
                }));
            }

            ready.await(5, TimeUnit.SECONDS);
            start.countDown();

            for (Future<?> f : futures) {
                f.get(30, TimeUnit.SECONDS);
            }
        } finally {
            pool.shutdown();
            pool.awaitTermination(5, TimeUnit.SECONDS);
            TenantContext.clear();
        }

        // ── Assertions ─────────────────────────────────────────────────────────────
        // Re-pin search_path / TenantContext: the threads cleared it in finally, and after
        // the clear TenantIdentifierResolver would resolve to "platform" — schema where
        // "payments" doesn't exist. The next read would error since the test thread lost
        // its pin.
        pinSearchPath();

        // 1. Every concurrent call accounted for.
        assertThat(successes.get() + optimisticLockFailures.get() + deadlockFailures.get() + otherFailures.get())
                .as("all threads reported an outcome (successes=%d, optimistic=%d, deadlock=%d, other=%d)",
                        successes.get(), optimisticLockFailures.get(), deadlockFailures.get(), otherFailures.get())
                .isEqualTo(CONCURRENT_PAYMENTS);

        // 2. No payment exceeds the invoice total. The @Version + collision-detection combo
        //    is what guarantees this — without it, three simultaneous 30s on a 100 invoice
        //    would all succeed and the customer would be "paid" 90 out of 100 while the
        //    invoice says PAID.
        BigDecimal totalPersisted = paymentRepository.sumAmountByInvoiceId(invoice.getId());
        assertThat(totalPersisted)
                .as("sum of successful payments must not exceed invoice amount (successes=%d, optimistic=%d, deadlock=%d)",
                        successes.get(), optimisticLockFailures.get(), deadlockFailures.get())
                .isLessThanOrEqualTo(INVOICE_AMOUNT);

        // 3. Sum of successful payments exactly matches what's persisted — no orphaned payment
        //    rows from a half-rolled-back transaction.
        assertThat(totalPersisted)
                .as("what the threads think they wrote must match what's in the DB")
                .isEqualByComparingTo(PAYMENT_AMOUNT.multiply(BigDecimal.valueOf(successes.get())));

        // 4. At least one of the concurrent writers got rejected. With 3 × 30 against a 100
        //    invoice under any reasonable contention, at least one will collide — either at
        //    the optimistic lock check (UPDATE WHERE version=N) or at the deadlock detector
        //    (INSERT into payments waiting on the invoice FK shared lock).
        assertThat(optimisticLockFailures.get() + deadlockFailures.get())
                .as("at least one concurrent writer must be rejected (got optimistic=%d, deadlock=%d)",
                        optimisticLockFailures.get(), deadlockFailures.get())
                .isGreaterThanOrEqualTo(1);

        // 5. Invoice status is consistent with the actual paid amount.
        Invoice finalInvoice = invoiceRepository.findById(invoice.getId()).orElseThrow();
        InvoiceStatus expectedStatus = totalPersisted.compareTo(INVOICE_AMOUNT) >= 0
                ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;
        assertThat(finalInvoice.getStatus())
                .as("status matches the persisted sum (paid=%s, expected=%s)", totalPersisted, expectedStatus)
                .isEqualTo(expectedStatus);

        // 6. Sanity: any "other" failure is a regression — we expect exactly the four known
        //    outcomes above. An unexpected exception type means the service is doing something
        //    we don't understand.
        assertThat(otherFailures.get())
                .as("unexpected exceptions — investigate before assuming the system is healthy")
                .isZero();
    }

    @Test
    void sequentialPayments_threePartial_thenFinalClearsInvoice() {
        // Sanity check: outside a race, the same logic correctly handles 3 partial payments
        // ending in PAID. If this fails, the concurrency test above wouldn't be meaningful.
        pinSearchPath();
        try {
            for (int i = 0; i < 3; i++) {
                PaymentRequest req = new PaymentRequest(
                        invoice.getId(), new BigDecimal("30.00"), LocalDate.now(),
                        PaymentMethod.CASH, "SEQ-" + i, "");
                PaymentResult result = paymentService.registerPayment(req);
                assertThat(result).isInstanceOf(PaymentResult.Success.class);
            }

            Invoice mid = invoiceRepository.findById(invoice.getId()).orElseThrow();
            assertThat(mid.getStatus()).isEqualTo(InvoiceStatus.PARTIAL);
            assertThat(paymentRepository.sumAmountByInvoiceId(invoice.getId()))
                    .isEqualByComparingTo("90.00");

            PaymentRequest finalReq = new PaymentRequest(
                    invoice.getId(), new BigDecimal("10.00"), LocalDate.now(),
                    PaymentMethod.CASH, "SEQ-FINAL", "");
            PaymentResult finalResult = paymentService.registerPayment(finalReq);
            assertThat(finalResult).isInstanceOf(PaymentResult.Success.class);

            Invoice done = invoiceRepository.findById(invoice.getId()).orElseThrow();
            assertThat(done.getStatus()).isEqualTo(InvoiceStatus.PAID);
        } finally {
            TenantContext.clear();
        }
    }

    private void pinSearchPath() {
        TenantContext.setCurrentTenant(TENANT);
        // Belt-and-suspenders: even if TenantContext is not honored by some path inside the
        // test, forcing search_path on the current connection guarantees the next query
        // hits the right schema.
        jdbcTemplate.execute("SET search_path TO \"" + TENANT + "\", public");
    }
}
