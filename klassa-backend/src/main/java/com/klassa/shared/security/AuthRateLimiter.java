package com.klassa.shared.security;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;

/**
 * Brute-force protection for authentication endpoints. Counts failed attempts per
 * (action, client IP, email) in a sliding Redis window and blocks once the limit is hit.
 * Successful auth resets the counter.
 */
@Component
public class AuthRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final StringRedisTemplate redis;

    public AuthRateLimiter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /** Rejects with 429 if too many recent failures for this (action, ip, email). */
    public void checkBlocked(String action, String ip, String email) {
        String value = redis.opsForValue().get(key(action, ip, email));
        if (value != null && Integer.parseInt(value) >= MAX_ATTEMPTS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos. Intenta de nuevo más tarde.");
        }
    }

    public void recordFailure(String action, String ip, String email) {
        String key = key(action, ip, email);
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redis.expire(key, WINDOW);
        }
    }

    public void reset(String action, String ip, String email) {
        redis.delete(key(action, ip, email));
    }

    private String key(String action, String ip, String email) {
        return "rl:auth:" + action + ":" + ip + ":" + (email == null ? "" : email.toLowerCase());
    }
}
