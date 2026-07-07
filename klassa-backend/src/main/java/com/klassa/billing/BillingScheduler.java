package com.klassa.billing;

import com.klassa.shared.multitenancy.TenantContext;
import com.klassa.tenant.Tenant;
import com.klassa.tenant.TenantRepository;
import com.klassa.tenant.TenantStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BillingScheduler {

    private static final Logger log = LoggerFactory.getLogger(BillingScheduler.class);

    private final InvoiceService invoiceService;
    private final TenantRepository tenantRepository;

    public BillingScheduler(InvoiceService invoiceService, TenantRepository tenantRepository) {
        this.invoiceService = invoiceService;
        this.tenantRepository = tenantRepository;
    }

    @Scheduled(cron = "0 5 0 * * *")
    public void markOverdueInvoices() {
        // Runs outside any HTTP request, so there is no TenantContext. Invoices live in each
        // tenant schema, so we must iterate tenants and run markOverdue inside each one's context;
        // otherwise the job silently only touches the (empty) platform schema.
        List<Tenant> tenants = tenantRepository.findAllByStatusIn(
                List.of(TenantStatus.ACTIVE, TenantStatus.TRIAL));
        log.info("Running markOverdue job for {} tenant(s)", tenants.size());

        for (Tenant tenant : tenants) {
            String subdomain = tenant.getSubdomain();
            TenantContext.setCurrentTenant(subdomain);
            try {
                invoiceService.markOverdue();
            } catch (Exception e) {
                // One tenant failing must not abort the rest.
                log.error("markOverdue failed for tenant {}", subdomain, e);
            } finally {
                TenantContext.clear();
            }
        }
        log.info("markOverdue job completed");
    }
}
