package com.klassa.tenant;

import com.klassa.shared.domain.BaseEntity;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "tenants", schema = "platform")
@Getter
@Setter
@NoArgsConstructor
public class Tenant extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String subdomain;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TenantStatus status = TenantStatus.TRIAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @Column
    private LocalDateTime trialEndsAt;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Set once a platform admin manually purges a CANCELLED tenant's schema. Null means
    // the tenant's data (if any) is still intact, regardless of status.
    @Column
    private LocalDateTime purgedAt;

    private static final Map<TenantStatus, Set<TenantStatus>> VALID_TRANSITIONS = Map.of(
        TenantStatus.TRIAL,     Set.of(TenantStatus.ACTIVE, TenantStatus.SUSPENDED, TenantStatus.CANCELLED),
        TenantStatus.ACTIVE,    Set.of(TenantStatus.SUSPENDED, TenantStatus.CANCELLED),
        TenantStatus.SUSPENDED, Set.of(TenantStatus.ACTIVE, TenantStatus.CANCELLED),
        TenantStatus.CANCELLED, Set.of()
    );

    public void transitionTo(TenantStatus next) {
        if (!VALID_TRANSITIONS.getOrDefault(this.status, Set.of()).contains(next))
            throw new BusinessRuleException(ErrorCode.INVALID_TENANT_TRANSITION, status, next);
        this.status = next;
    }
}
