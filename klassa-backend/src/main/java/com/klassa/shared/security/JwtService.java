package com.klassa.shared.security;

import com.klassa.user.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    /** Must match the dev default in application.yml; rejected outside dev. */
    private static final String DEFAULT_DEV_SECRET =
            "klassa-super-secret-key-must-be-at-least-256-bits-long-for-hs256-algorithm";

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expirationMs,
            Environment environment) {
        // Allowlist known-safe local profiles instead of blocklisting "prod" —
        // any unset/unrecognized profile (staging, qa, a typo'd prod alias) must
        // never silently sign tokens with a publicly-known secret.
        boolean isDevLike = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("dev") || p.equalsIgnoreCase("local") || p.equalsIgnoreCase("test"));
        if (!isDevLike && DEFAULT_DEV_SECRET.equals(secret)) {
            throw new IllegalStateException(
                    "JWT_SECRET must be set to a strong value outside dev/local/test profiles; the dev default is not allowed.");
        }
        // hmacShaKeyFor already enforces >= 256 bits for HS256.
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Long userId, String email, String tenantId, UserRole role) {
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("tenantId", tenantId)
                .claim("role", role.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(signingKey)
                .compact();
    }

    public Optional<Claims> parseToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Optional<SecurityUser> extractSecurityUser(String token) {
        return parseToken(token).map(claims -> new SecurityUser(
                claims.get("userId", Long.class),
                claims.getSubject(),
                claims.get("tenantId", String.class),
                UserRole.valueOf(claims.get("role", String.class))
        ));
    }
}
