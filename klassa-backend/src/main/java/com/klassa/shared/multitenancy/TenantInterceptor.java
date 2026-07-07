package com.klassa.shared.multitenancy;

import com.klassa.shared.security.SecurityUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

@Component
public class TenantInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String jwtTenant = authenticatedTenant();

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
            TenantContext.setCurrentTenant(jwtTenant);
            return true;
        }

        // Unauthenticated request (e.g. login): trust the header/host to pick the tenant.
        Optional<String> requested = resolveRequestedTenant(request);
        if (requested.isPresent()) {
            // Reject malformed subdomains before they ever reach `SET search_path`.
            if (!TenantSubdomain.isValid(requested.get())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid tenant subdomain");
            }
            TenantContext.setCurrentTenant(requested.get());
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        TenantContext.clear();
    }

    /** Tenant from the authenticated principal, or null if the request is not authenticated. */
    private String authenticatedTenant() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof SecurityUser user) {
            return user.tenantId();
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
