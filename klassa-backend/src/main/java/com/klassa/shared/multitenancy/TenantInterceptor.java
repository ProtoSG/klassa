package com.klassa.shared.multitenancy;

import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.security.SecurityUser;
import com.klassa.tenant.TenantService;
import com.klassa.tenant.dto.TenantResponse;
import com.klassa.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

@Component
public class TenantInterceptor implements HandlerInterceptor {

    /** MDC key for the current tenant's subdomain. Mirrored by {@code LogContextFilter}'s clearing. */
    public static final String MDC_TENANT_ID = "tenantId";

    private final TenantService tenantService;
    private final UserService userService;

    public TenantInterceptor(TenantService tenantService, UserService userService) {
        this.tenantService = tenantService;
        this.userService = userService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        try {
            return doPreHandle(request);
        } catch (RuntimeException e) {
            // preHandle throwing skips this interceptor's own afterCompletion (Spring only
            // triggers afterCompletion for interceptors that already returned successfully),
            // so TenantContext.clear() below would never run — clear it here instead to avoid
            // leaking a stale tenant into the next request on this pooled Tomcat thread.
            TenantContext.clear();
            MDC.remove(MDC_TENANT_ID);
            throw e;
        }
    }

    private boolean doPreHandle(HttpServletRequest request) {
        SecurityUser user = authenticatedUser();
        String jwtTenant = user != null ? user.tenantId() : null;

        if (jwtTenant != null) {
            // Authenticated request: tenant is bound by the JWT (already set by JwtAuthFilter).
            // The host is ignored and an explicit header MUST NOT switch schemas — otherwise a
            // user of tenant A could read tenant B's data by spoofing X-Tenant-Subdomain.
            String explicit = explicitHeader(request);
            if (explicit != null) {
                if (!TenantSubdomain.isValid(explicit)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid tenant subdomain");
                }
                if (!explicit.equals(jwtTenant)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tenant mismatch");
                }
            }
            rejectIfBlocked(jwtTenant);
            TenantContext.setCurrentTenant(jwtTenant);
            MDC.put(MDC_TENANT_ID, jwtTenant);
            // Platform-admin users live in a separate table (platform.platform_users), not the
            // tenant `users` table this check queries — only run it for real tenant principals.
            if (!TenantContext.PLATFORM.equals(jwtTenant)) {
                rejectIfDeactivated(user.userId());
            }
            return true;
        }

        // Unauthenticated request (e.g. login): trust the header/host to pick the tenant.
        Optional<String> requested = resolveRequestedTenant(request);
        if (requested.isPresent()) {
            // Reject malformed subdomains before they ever reach `SET search_path`.
            if (!TenantSubdomain.isValid(requested.get())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid tenant subdomain");
            }
            rejectIfBlocked(requested.get());
            TenantContext.setCurrentTenant(requested.get());
            MDC.put(MDC_TENANT_ID, requested.get());
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        TenantContext.clear();
        MDC.remove(MDC_TENANT_ID);
    }

    /** Cuts access for a SUSPENDED/CANCELLED tenant on every request, login included. */
    private void rejectIfBlocked(String subdomain) {
        if (TenantContext.PLATFORM.equals(subdomain)) return;

        TenantResponse tenant;
        try {
            tenant = tenantService.findBySubdomain(subdomain);
        } catch (EntityNotFoundException e) {
            return; // unknown subdomain: leave existing downstream behavior untouched
        }

        switch (tenant.status()) {
            case SUSPENDED -> throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "La cuenta de este colegio está suspendida. Contacta al administrador de la plataforma.");
            case CANCELLED -> throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "La cuenta de este colegio ha sido cancelada.");
            default -> { }
        }
    }

    /** Cuts access the moment a user is deactivated, instead of waiting for their JWT to expire. */
    private void rejectIfDeactivated(Long userId) {
        if (!userService.isActive(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Tu cuenta fue desactivada. Contacta al administrador del colegio.");
        }
    }

    /** Authenticated principal, or null if the request is not authenticated. */
    private SecurityUser authenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof SecurityUser user) {
            return user;
        }
        return null;
    }

    private String explicitHeader(HttpServletRequest request) {
        String explicitTenant = request.getHeader("X-Tenant-Subdomain");
        return (explicitTenant != null && !explicitTenant.isBlank()) ? explicitTenant.trim() : null;
    }

    /** Explicit header wins (dev/API clients). Falls back to Host subdomain (prod). */
    private Optional<String> resolveRequestedTenant(HttpServletRequest request) {
        String explicit = explicitHeader(request);
        if (explicit != null) {
            return Optional.of(explicit);
        }
        return extractSubdomain(request.getServerName());
    }

    private Optional<String> extractSubdomain(String host) {
        if (host == null || host.isBlank()) return Optional.empty();
        // Strip port if present (e.g. "colegio1.klassa.app:8080")
        String cleanHost = host.split(":")[0];
        String[] parts = cleanHost.split("\\.");
        // Minimum: subdomain.domain.tld → 3 parts
        if (parts.length >= 3) {
            return Optional.of(parts[0]);
        }
        return Optional.empty();
    }
}
