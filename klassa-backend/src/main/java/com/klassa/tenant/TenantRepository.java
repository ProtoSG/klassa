package com.klassa.tenant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findBySubdomain(String subdomain);

    boolean existsBySubdomain(String subdomain);

    List<Tenant> findAllByStatusIn(List<TenantStatus> statuses);

    List<Tenant> findAllByStatusAndTrialEndsAtBefore(TenantStatus status, LocalDateTime cutoff);
}
