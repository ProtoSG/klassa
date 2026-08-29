package com.klassa.tenant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findBySubdomain(String subdomain);

    boolean existsBySubdomain(String subdomain);

    List<Tenant> findAllByStatusIn(List<TenantStatus> statuses);

    List<Tenant> findAllByStatusAndTrialEndsAtBefore(TenantStatus status, LocalDateTime cutoff);

    // Selects the Plan directly (rather than navigating a lazy Tenant.plan proxy) so callers
    // outside an open Hibernate session — e.g. AssistantService, resolving the current tenant's
    // AI quota before an external HTTP call — get a fully-initialized Plan back.
    @Query("select t.plan from Tenant t where t.subdomain = :subdomain")
    Optional<Plan> findPlanBySubdomain(String subdomain);
}
