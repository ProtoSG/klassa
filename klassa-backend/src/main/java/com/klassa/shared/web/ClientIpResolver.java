package com.klassa.shared.web;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Resolves the client IP used as a rate-limiting key.
 *
 * Deliberately ignores X-Forwarded-For: this deployment has no reverse proxy
 * that overwrites/strips client-supplied headers (see docker-compose.dev.yml —
 * the app is exposed directly), so trusting XFF let an attacker rotate the
 * header per request and bypass AuthRateLimiter's brute-force lock entirely.
 * If a trusted reverse proxy is introduced later, this must read XFF only
 * when request.getRemoteAddr() matches a configured trusted-proxy allowlist.
 */
public final class ClientIpResolver {

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
