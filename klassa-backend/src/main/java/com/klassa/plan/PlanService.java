package com.klassa.plan;

import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.multitenancy.TenantContext;
import com.klassa.tenant.Plan;
import com.klassa.tenant.TenantRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resolves the current tenant's plan features. Cached per-subdomain in Redis
 * (TTL 10 min, configured globally in {@code RedisConfig}). Cache is evicted
 * whenever {@code TenantService.updatePlan} runs.
 *
 * Read-mostly path: a Plan row changes rarely (only on plan upgrade/downgrade
 * by a platform admin), so 10-min TTL is safe and keeps the hot path off the
 * platform DB.
 */
@Service
@Transactional(readOnly = true)
public class PlanService {

    /** Cache name used by {@link #getFeatures(String)}. Kept as a constant so {@code @CacheEvict} in other services can target it. */
    public static final String CACHE = "planFeatures";

    private final TenantRepository tenantRepository;

    public PlanService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Cacheable(value = CACHE, key = "#subdomain")
    public PlanFeatures getFeatures(String subdomain) {
        Plan plan = tenantRepository.findPlanBySubdomain(subdomain)
                .orElseThrow(() -> new EntityNotFoundException("Plan", "subdomain", subdomain));
        return PlanFeatures.from(plan);
    }

    /** Convenience for callers that already have a tenant in {@link TenantContext}. */
    public PlanFeatures getCurrentFeatures() {
        return getFeatures(TenantContext.getCurrentTenant());
    }

    /** Called by {@code TenantService.updatePlan} so the next request sees the new features. */
    @CacheEvict(value = CACHE, key = "#subdomain")
    public void evictCache(String subdomain) {
        // Body intentionally empty — the annotation does the work.
    }
}
