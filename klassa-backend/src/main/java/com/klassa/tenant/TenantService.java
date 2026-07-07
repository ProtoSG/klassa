package com.klassa.tenant;

import com.klassa.config.FlywayConfig;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.multitenancy.TenantContext;
import com.klassa.tenant.dto.RegisterTenantRequest;
import com.klassa.tenant.dto.TenantProvisionResponse;
import com.klassa.tenant.dto.TenantRequest;
import com.klassa.tenant.dto.TenantResponse;
import com.klassa.user.UserService;
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

    private final TenantRepository tenantRepository;
    private final PlanRepository planRepository;
    private final FlywayConfig flywayConfig;
    private final JdbcTemplate jdbcTemplate;
    private final UserService userService;
    // Self-reference (proxied) so provisionWithAdmin can call createTenant through the Spring
    // proxy and trigger its @Transactional; a plain this.createTenant(...) would bypass it.
    private final TenantService self;

    public TenantService(TenantRepository tenantRepository, PlanRepository planRepository,
                         FlywayConfig flywayConfig, JdbcTemplate jdbcTemplate,
                         UserService userService, @Lazy TenantService self) {
        this.tenantRepository = tenantRepository;
        this.planRepository = planRepository;
        this.flywayConfig = flywayConfig;
        this.jdbcTemplate = jdbcTemplate;
        this.userService = userService;
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
            // DDL (CREATE SCHEMA) already committed — clean up tenant record manually
            tenantRepository.findBySubdomain(request.subdomain())
                    .ifPresent(tenantRepository::delete);
            jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + request.subdomain() + "\" CASCADE");
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
        tenant.setPlan(plan);
        return toResponse(tenantRepository.save(tenant));
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
                t.getCreatedAt()
        );
    }
}
