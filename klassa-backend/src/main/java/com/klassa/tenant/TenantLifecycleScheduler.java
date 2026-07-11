package com.klassa.tenant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class TenantLifecycleScheduler {

    private static final Logger log = LoggerFactory.getLogger(TenantLifecycleScheduler.class);

    private final TenantRepository tenantRepository;
    private final TenantService tenantService;

    public TenantLifecycleScheduler(TenantRepository tenantRepository, TenantService tenantService) {
        this.tenantRepository = tenantRepository;
        this.tenantService = tenantService;
    }

    // trialEndsAt was previously a display-only field with no enforcement — a TRIAL tenant
    // could use the product indefinitely past its trial date unless a human intervened.
    @Scheduled(cron = "0 10 0 * * *")
    public void suspendExpiredTrials() {
        List<Tenant> expired = tenantRepository.findAllByStatusAndTrialEndsAtBefore(
                TenantStatus.TRIAL, LocalDateTime.now());
        if (expired.isEmpty()) return;

        log.info("Suspending {} tenant(s) with an expired trial", expired.size());
        for (Tenant tenant : expired) {
            try {
                tenantService.updateStatus(tenant.getSubdomain(), TenantStatus.SUSPENDED);
            } catch (Exception e) {
                // One tenant failing must not abort the rest.
                log.error("Failed to suspend expired-trial tenant {}", tenant.getSubdomain(), e);
            }
        }
    }
}
