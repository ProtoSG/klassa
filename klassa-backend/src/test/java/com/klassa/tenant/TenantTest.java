package com.klassa.tenant;

import com.klassa.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TenantTest {

    private Tenant tenant(TenantStatus status) {
        Tenant t = new Tenant();
        t.setStatus(status);
        return t;
    }

    @Test
    void transition_trialToActive_ok() {
        Tenant t = tenant(TenantStatus.TRIAL);
        t.transitionTo(TenantStatus.ACTIVE);
        assertThat(t.getStatus()).isEqualTo(TenantStatus.ACTIVE);
    }

    @Test
    void transition_activeToSuspended_ok() {
        Tenant t = tenant(TenantStatus.ACTIVE);
        t.transitionTo(TenantStatus.SUSPENDED);
        assertThat(t.getStatus()).isEqualTo(TenantStatus.SUSPENDED);
    }

    @Test
    void transition_suspendedToActive_ok() {
        Tenant t = tenant(TenantStatus.SUSPENDED);
        t.transitionTo(TenantStatus.ACTIVE);
        assertThat(t.getStatus()).isEqualTo(TenantStatus.ACTIVE);
    }

    @Test
    void transition_cancelledToActive_throws() {
        Tenant t = tenant(TenantStatus.CANCELLED);
        assertThatThrownBy(() -> t.transitionTo(TenantStatus.ACTIVE))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("No se puede cambiar el estado");
    }

    @Test
    void transition_trialToTrial_throws() {
        Tenant t = tenant(TenantStatus.TRIAL);
        assertThatThrownBy(() -> t.transitionTo(TenantStatus.TRIAL))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void transition_anyToCancelled_ok() {
        Tenant t = tenant(TenantStatus.ACTIVE);
        t.transitionTo(TenantStatus.CANCELLED);
        assertThat(t.getStatus()).isEqualTo(TenantStatus.CANCELLED);
    }
}
