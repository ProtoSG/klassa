package com.klassa.tenant;

import com.klassa.shared.multitenancy.TenantContext;
import com.klassa.student.StudentRepository;
import com.klassa.student.StudentStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cross-schema read helper for tenant-owned tables. Lives in its own bean so the
 * Spring proxy can actually start a NEW transaction (REQUIRES_NEW), unlike a
 * self-invocation inside {@code TenantService} which would bypass the proxy and
 * share the caller's connection.
 *
 * <p>Why this matters: {@link TenantService#updatePlan} runs inside a
 * {@code @Transactional} on the {@code platform} schema (Tenant/Plan live there).
 * Changing {@link TenantContext} does NOT re-apply the search_path on the
 * already-acquired connection — Hibernate locks that in. Calling
 * {@link StudentRepository#countByStatus} on the same connection would query
 * {@code platform.students} and fail with "relation does not exist".
 *
 * <p>{@code REQUIRES_NEW} suspends the outer transaction, opens a fresh
 * connection through the {@code MultiTenantConnectionProvider} (which sets
 * {@code search_path} per the current {@link TenantContext}), runs the query,
 * commits, and returns the connection — leaving the platform transaction
 * intact and able to keep writing through its own connection.
 */
@Service
public class TenantStudentCounter {

    private final StudentRepository studentRepository;

    public TenantStudentCounter(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public long countActiveStudentsByTenant(String subdomain) {
        TenantContext.setCurrentTenant(subdomain);
        try {
            return studentRepository.countByStatus(StudentStatus.ACTIVE);
        } finally {
            TenantContext.clear();
        }
    }
}
