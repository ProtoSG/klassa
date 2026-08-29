package com.klassa.shared.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Seeds the log MDC with the per-request correlation id and mirrors it back
 * as the {@code X-Request-Id} response header so a user reporting a bug can
 * hand the dev the value they see in DevTools and the dev can grep one line
 * out of the log aggregator.
 *
 * <p>Order: {@link Ordered#HIGHEST_PRECEDENCE} so the {@code requestId} field
 * is present on every log line emitted during the request — including any
 * that the Spring Security filter chain emits during token validation.
 *
 * <p>Note: this filter only seeds {@code requestId}. {@code tenantId} and
 * {@code userId} are populated by {@code TenantInterceptor} and
 * {@code JwtAuthFilter} respectively, when they learn the values. The
 * finally block defensively clears the entire MDC on the way out so values
 * never leak into the next request handled by the same pooled thread.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LogContextFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String MDC_REQUEST_ID = "requestId";

    /** Defensive cap on inbound header values to keep unbounded attacker input out of log lines. */
    private static final int MAX_INBOUND_REQUEST_ID_LENGTH = 64;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String requestId = resolveRequestId(request);
        try {
            MDC.put(MDC_REQUEST_ID, requestId);
            response.setHeader(REQUEST_ID_HEADER, requestId);
            filterChain.doFilter(request, response);
        } finally {
            // Clear every MDC entry we (or TenantInterceptor / JwtAuthFilter) put on the
            // thread — Tomcat pulls worker threads from a pool, and a stale MDC on the next
            // request would attach yesterday's tenantId to today's unrelated log line.
            MDC.clear();
        }
    }

    private String resolveRequestId(HttpServletRequest request) {
        String incoming = request.getHeader(REQUEST_ID_HEADER);
        if (incoming != null && !incoming.isBlank() && incoming.length() <= MAX_INBOUND_REQUEST_ID_LENGTH) {
            return incoming.trim();
        }
        return UUID.randomUUID().toString();
    }
}
