package com.klassa.shared.multitenancy;

import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.security.SecurityUser;
import com.klassa.tenant.TenantService;
import com.klassa.tenant.TenantStatus;
import com.klassa.tenant.dto.TenantResponse;
import com.klassa.user.UserRole;
import com.klassa.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantInterceptorTest {

    @Mock
    private TenantService tenantService;
    @Mock
    private UserService userService;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;

    private TenantInterceptor interceptor;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();
    }

    private TenantInterceptor interceptor() {
        return new TenantInterceptor(tenantService, userService);
    }

    private TenantResponse tenantWithStatus(TenantStatus status) {
        return new TenantResponse(1L, "colegio1", "Colegio 1", status, 1L, "Plan",
                LocalDateTime.now(), LocalDateTime.now(), null);
    }

    private void authenticateAs(String tenantId) {
        SecurityUser user = new SecurityUser(1L, "admin@colegio1.com", tenantId, UserRole.ADMIN);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    }

    @Test
    void authenticatedRequest_activeTenant_isAllowed() {
        authenticateAs("colegio1");
        when(tenantService.findBySubdomain("colegio1")).thenReturn(tenantWithStatus(TenantStatus.ACTIVE));
        when(userService.isActive(1L)).thenReturn(true);

        assertThat(interceptor().preHandle(request, response, new Object())).isTrue();
        assertThat(TenantContext.getCurrentTenant()).isEqualTo("colegio1");
    }

    @Test
    void authenticatedRequest_deactivatedUser_isBlocked() {
        authenticateAs("colegio1");
        when(tenantService.findBySubdomain("colegio1")).thenReturn(tenantWithStatus(TenantStatus.ACTIVE));
        when(userService.isActive(1L)).thenReturn(false);

        assertThatThrownBy(() -> interceptor().preHandle(request, response, new Object()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("desactivada");
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }

    @Test
    void authenticatedRequest_suspendedTenant_isBlocked() {
        authenticateAs("colegio1");
        when(tenantService.findBySubdomain("colegio1")).thenReturn(tenantWithStatus(TenantStatus.SUSPENDED));

        assertThatThrownBy(() -> interceptor().preHandle(request, response, new Object()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("suspendida");
        // Must not leak a tenant into the thread once blocked.
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }

    @Test
    void authenticatedRequest_cancelledTenant_isBlocked() {
        authenticateAs("colegio1");
        when(tenantService.findBySubdomain("colegio1")).thenReturn(tenantWithStatus(TenantStatus.CANCELLED));

        assertThatThrownBy(() -> interceptor().preHandle(request, response, new Object()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("cancelada");
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }

    @Test
    void platformAdminRequest_isNeverBlocked_regardlessOfAnyTenantStatus() {
        authenticateAs(TenantContext.PLATFORM);

        assertThat(interceptor().preHandle(request, response, new Object())).isTrue();
        assertThat(TenantContext.getCurrentTenant()).isEqualTo(TenantContext.PLATFORM);
    }

    @Test
    void unauthenticatedLoginRequest_suspendedTenant_isBlocked() {
        when(request.getHeader("X-Tenant-Subdomain")).thenReturn("colegio1");
        when(tenantService.findBySubdomain("colegio1")).thenReturn(tenantWithStatus(TenantStatus.SUSPENDED));

        assertThatThrownBy(() -> interceptor().preHandle(request, response, new Object()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("suspendida");
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }

    @Test
    void unauthenticatedLoginRequest_unknownSubdomain_isNotBlocked() {
        when(request.getHeader("X-Tenant-Subdomain")).thenReturn("no-existe");
        when(tenantService.findBySubdomain("no-existe"))
                .thenThrow(new EntityNotFoundException("Tenant", "subdomain", "no-existe"));

        assertThat(interceptor().preHandle(request, response, new Object())).isTrue();
        assertThat(TenantContext.getCurrentTenant()).isEqualTo("no-existe");
    }
}
