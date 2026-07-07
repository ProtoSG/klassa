package com.klassa.tenant;

import com.klassa.config.FlywayConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Applies pending tenant migrations to every existing tenant schema on startup.
 * <p>
 * Tenant migrations otherwise only run when a tenant is first provisioned, so a newly added
 * migration (e.g. V9) would never reach tenants created earlier. Flyway is idempotent, so this
 * only applies versions each schema is missing.
 */
@Component
public class TenantMigrationRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(TenantMigrationRunner.class);

    private final TenantRepository tenantRepository;
    private final FlywayConfig flywayConfig;

    public TenantMigrationRunner(TenantRepository tenantRepository, FlywayConfig flywayConfig) {
        this.tenantRepository = tenantRepository;
        this.flywayConfig = flywayConfig;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<Tenant> tenants = tenantRepository.findAll();
        log.info("Applying pending tenant migrations to {} schema(s)", tenants.size());
        for (Tenant tenant : tenants) {
            try {
                flywayConfig.runTenantMigrations(tenant.getSubdomain());
            } catch (Exception e) {
                // Don't let one bad tenant schema block startup or the others.
                log.error("Tenant migration failed for {}", tenant.getSubdomain(), e);
            }
        }
    }
}
