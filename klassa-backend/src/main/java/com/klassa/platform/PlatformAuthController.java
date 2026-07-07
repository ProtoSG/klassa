package com.klassa.platform;

import com.klassa.shared.multitenancy.TenantContext;
import com.klassa.shared.security.AuthRateLimiter;
import com.klassa.shared.security.JwtService;
import com.klassa.shared.web.ApiResponse;
import com.klassa.user.dto.LoginRequest;
import com.klassa.user.dto.LoginResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.klassa.shared.security.SecurityUser;

import java.time.Duration;

@RestController
@RequestMapping("/api/platform/auth")
@Tag(name = "Platform Auth")
public class PlatformAuthController {

    private final PlatformUserRepository platformUserRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthRateLimiter rateLimiter;
    private final String cookieName;
    private final boolean cookieSecure;
    private final long jwtExpiration;

    public PlatformAuthController(PlatformUserRepository platformUserRepository,
                                   JwtService jwtService,
                                   PasswordEncoder passwordEncoder,
                                   AuthRateLimiter rateLimiter,
                                   @Value("${jwt.cookie-name}") String cookieName,
                                   @Value("${jwt.cookie-secure}") boolean cookieSecure,
                                   @Value("${jwt.expiration}") long jwtExpiration) {
        this.platformUserRepository = platformUserRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.rateLimiter = rateLimiter;
        this.cookieName = cookieName;
        this.cookieSecure = cookieSecure;
        this.jwtExpiration = jwtExpiration;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request,
                                                             HttpServletRequest httpRequest,
                                                             HttpServletResponse response) {
        String ip = clientIp(httpRequest);
        rateLimiter.checkBlocked("platform-login", ip, request.email());

        PlatformUser user = platformUserRepository.findByEmailAndActiveTrue(request.email())
                .orElseThrow(() -> {
                    rateLimiter.recordFailure("platform-login", ip, request.email());
                    return new BadCredentialsException("Invalid credentials");
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            rateLimiter.recordFailure("platform-login", ip, request.email());
            throw new BadCredentialsException("Invalid credentials");
        }

        rateLimiter.reset("platform-login", ip, request.email());
        String token = jwtService.generateToken(user.getId(), user.getEmail(), TenantContext.PLATFORM, user.getRole());
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(token, jwtExpiration).toString());

        return ResponseEntity.ok(ApiResponse.ok(
                new LoginResponse(user.getEmail(), user.fullName(), user.getRole(), TenantContext.PLATFORM),
                "Login successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse>> getMe(@AuthenticationPrincipal SecurityUser principal) {
        PlatformUser user = platformUserRepository.findByEmailAndActiveTrue(principal.email())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "User not found"));
        return ResponseEntity.ok(ApiResponse.ok(
                new LoginResponse(user.getEmail(), user.fullName(), user.getRole(), TenantContext.PLATFORM),
                "OK"));
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private ResponseCookie buildCookie(String value, long maxAgeMillis) {
        return ResponseCookie.from(cookieName, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/api")
                .maxAge(Duration.ofMillis(maxAgeMillis))
                .build();
    }
}
