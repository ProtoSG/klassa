package com.klassa.tenant;

import com.klassa.config.FlywayConfig;
import com.klassa.plan.PlanService;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.multitenancy.TenantContext;
import com.klassa.tenant.dto.RegisterTenantRequest;
import com.klassa.tenant.dto.TenantProvisionResponse;
import com.klassa.tenant.dto.TenantRequest;
import com.klassa.tenant.dto.TenantResponse;
import com.klassa.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TenantService {

    private static final Logger log = LoggerFactory.getLogger(TenantService.class);

    // Plans at or above this cap are treated as "unlimited" (matches the frontend's own
    // `maxStudents >= 9999` convention in Pricing.tsx) — no usage check needed against them.
    private static final int UNLIMITED_PLAN_THRESHOLD = 9999;

    private final TenantRepository tenantRepository;
    private final PlanRepository planRepository;
    private final FlywayConfig flywayConfig;
    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;
    private final PlanService planService;
    private final TenantStudentCounter tenantStudentCounter;
    // Self-reference (proxied) so provisionWithAdmin can call createTenant through the Spring
    // proxy and trigger its @Transactional; a plain this.createTenant(...) would bypass it.
    private final TenantService self;

    public TenantService(TenantRepository tenantRepository, PlanRepository planRepository,
                         FlywayConfig flywayConfig, JdbcTemplate jdbcTemplate,
                         UserService userService,
                         PlanService planService,
                         TenantStudentCounter tenantStudentCounter,
                         @Lazy TenantService self) {
        this.tenantRepository = tenantRepository;
        this.planRepository = planRepository;
        this.flywayConfig = flywayConfig;
        this.jdbcTemplate = jdbcTemplate;
        this.userService = userService;
        this.planService = planService;
        this.tenantStudentCounter = tenantStudentCounter;
        this.self = self;
    }

    @Transactional
    @CacheEvict(value = "tenants", allEntries = true)
    public TenantResponse createTenant(TenantRequest request) {
        if (tenantRepository.existsBySubdomain(request.subdomain())) {
            throw new BusinessRuleException(ErrorCode.SUBDOMAIN_TAKEN, request.subdomain());
        }

        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new EntityNotFoundException("Plan", request.planId()));

        Tenant tenant = new Tenant();
        tenant.setSubdomain(request.subdomain());
        tenant.setName(request.name());
        tenant.setPlan(plan);
        tenant.setStatus(TenantStatus.TRIAL);
        tenant.setCreatedAt(LocalDateTime.now());

        int trialDays = request.trialDays() != null ? request.trialDays() : 30;
        tenant.setTrialEndsAt(LocalDateTime.now().plusDays(trialDays));

        Tenant saved = tenantRepository.save(tenant);
        provisionSchema(request.subdomain());

        return toResponse(saved);
    }

    // NOT a single transaction: tenant insert (platform schema) and admin insert (tenant schema)
    // need SEPARATE connections so each acquires the correct search_path for its TenantContext.
    // Hibernate sets search_path once, at connection acquisition, from the resolved tenant id.
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public TenantProvisionResponse provisionWithAdmin(RegisterTenantRequest request) {
        // Via self-proxy so createTenant's @Transactional actually starts a platform write tx
        // (a plain this.createTenant(...) call would bypass the proxy).
        TenantResponse tenant = self.createTenant(new TenantRequest(
                request.subdomain(), request.name(), request.planId(), request.trialDays()));

        String tempPassword = UUID.randomUUID().toString().replace("-", "").substring(0, 12) + "A1!";

        TenantContext.setCurrentTenant(request.subdomain());
        try {
            userService.createInitialAdmin(
                    request.adminEmail(), tempPassword,
                    request.adminFirstName(), request.adminLastName());
        } catch (Exception e) {
            // DDL (CREATE SCHEMA) already committed — clean up manually. Each step is isolated
            // so one failing (e.g. the row delete) doesn't prevent the other (the schema drop)
            // from being attempted, and both failures are logged with enough detail to fix by
            // hand instead of silently swallowing a half-cleaned-up tenant.
            log.error("Tenant provisioning failed for '{}' after schema creation — rolling back",
                    request.subdomain(), e);
            try {
                tenantRepository.findBySubdomain(request.subdomain())
                        .ifPresent(tenantRepository::delete);
            } catch (Exception cleanupEx) {
                log.error("Rollback: failed to delete tenant row for '{}'", request.subdomain(), cleanupEx);
            }
            try {
                dropTenantSchema(request.subdomain());
            } catch (Exception cleanupEx) {
                log.error("Rollback: failed to drop schema for '{}' — manual cleanup required",
                        request.subdomain(), cleanupEx);
            }
            throw e;
        } finally {
            TenantContext.clear();
        }

        return new TenantProvisionResponse(tenant, tempPassword);
    }

    @Cacheable(value = "tenants", key = "#subdomain")
    public TenantResponse findBySubdomain(String subdomain) {
        return tenantRepository.findBySubdomain(subdomain)
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Tenant", "subdomain", subdomain));
    }

    public List<TenantResponse> findAll() {
        return tenantRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    @CacheEvict(value = "tenants", key = "#subdomain")
    public TenantResponse updateStatus(String subdomain, TenantStatus newStatus) {
        Tenant tenant = tenantRepository.findBySubdomain(subdomain)
                .orElseThrow(() -> new EntityNotFoundException("Tenant", "subdomain", subdomain));
        tenant.transitionTo(newStatus);
        return toResponse(tenantRepository.save(tenant));
    }

    @Transactional
    @CacheEvict(value = "tenants", key = "#subdomain")
    public TenantResponse updatePlan(String subdomain, Long planId) {
        Tenant tenant = tenantRepository.findBySubdomain(subdomain)
                .orElseThrow(() -> new EntityNotFoundException("Tenant", "subdomain", subdomain));
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("Plan", planId));

        if (plan.getMaxStudents() < UNLIMITED_PLAN_THRESHOLD) {
            long activeStudents = tenantStudentCounter.countActiveStudentsByTenant(subdomain);
            if (activeStudents > plan.getMaxStudents()) {
                throw new BusinessRuleException(ErrorCode.PLAN_BELOW_CURRENT_USAGE, activeStudents, plan.getMaxStudents());
            }
        }

        tenant.setPlan(plan);
        TenantResponse response = toResponse(tenantRepository.save(tenant));
        // Drop the cached plan features so the very next request — including the ones from
        // BillingController / AssistantController behind @RequiresModule — sees the new caps.
        planService.evictCache(subdomain);
        return response;
    }

    /**
     * Drops a CANCELLED tenant's Postgres schema for good. Only callable once per tenant
     * (guarded by {@code purgedAt}); the platform-side {@code tenants} row is kept as a
     * tombstone so the subdomain can't be silently reused and who/when is still on record
     * (via the existing {@code user_updated}/{@code date_updated} JPA auditing columns).
     */
    @Transactional
    @CacheEvict(value = "tenants", key = "#subdomain")
    public TenantResponse purgeData(String subdomain) {
        Tenant tenant = tenantRepository.findBySubdomain(subdomain)
                .orElseThrow(() -> new EntityNotFoundException("Tenant", "subdomain", subdomain));
        if (tenant.getStatus() != TenantStatus.CANCELLED) {
            throw new BusinessRuleException(ErrorCode.TENANT_NOT_CANCELLED);
        }
        if (tenant.getPurgedAt() != null) {
            throw new BusinessRuleException(ErrorCode.TENANT_ALREADY_PURGED);
        }

        dropTenantSchema(subdomain);
        tenant.setPurgedAt(LocalDateTime.now());
        TenantResponse response = toResponse(tenantRepository.save(tenant));
        log.warn("Tenant data purged: subdomain={} name={}", subdomain, tenant.getName());
        return response;
    }

    private void dropTenantSchema(String schemaName) {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schemaName + "\" CASCADE");
    }

    private void provisionSchema(String schemaName) {
        // Flyway creates the schema (.schemas(...)) on its own connection and commits it.
        // Do NOT also CREATE SCHEMA on the transaction-bound connection — the uncommitted
        // DDL lock would block Flyway's separate connection → deadlock.
        flywayConfig.runTenantMigrations(schemaName);
    }

    private TenantResponse toResponse(Tenant t) {
        return new TenantResponse(
                t.getId(),
                t.getSubdomain(),
                t.getName(),
                t.getStatus(),
                t.getPlan().getId(),
                t.getPlan().getName(),
                t.getTrialEndsAt(),
                t.getCreatedAt(),
                t.getPurgedAt()
        );
    }
}
