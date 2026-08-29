package com.klassa.user.auth;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.multitenancy.TenantContext;
import com.klassa.shared.security.AuthRateLimiter;
import com.klassa.shared.security.JwtService;
import com.klassa.shared.web.ApiResponse;
import com.klassa.shared.web.ClientIpResolver;
import com.klassa.user.User;
import com.klassa.user.UserService;
import com.klassa.user.dto.ChangePasswordRequest;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.klassa.shared.security.SecurityUser;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthRateLimiter rateLimiter;
    private final String cookieName;
    private final boolean cookieSecure;
    private final long jwtExpiration;

    public AuthController(UserService userService,
                          JwtService jwtService,
                          PasswordEncoder passwordEncoder,
                          AuthRateLimiter rateLimiter,
                          @Value("${jwt.cookie-name}") String cookieName,
                          @Value("${jwt.cookie-secure}") boolean cookieSecure,
                          @Value("${jwt.expiration}") long jwtExpiration) {
        this.userService = userService;
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
        rateLimiter.checkBlocked("login", ip, request.email());

        User user = userService.loadByEmail(request.email());

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            rateLimiter.recordFailure("login", ip, request.email());
            throw new BadCredentialsException("Invalid credentials");
        }

        if (Boolean.TRUE.equals(user.getMustChangePassword())) {
            // Structured code so the frontend can redirect to the change-password form.
            throw new BusinessRuleException(ErrorCode.PASSWORD_CHANGE_REQUIRED);
        }

        rateLimiter.reset("login", ip, request.email());
        String tenantId = TenantContext.getCurrentTenant();
        String token = jwtService.generateToken(user.getId(), user.getEmail(), tenantId, user.getRole());

        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(token, jwtExpiration).toString());

        return ResponseEntity.ok(ApiResponse.ok(
                new LoginResponse(user.getEmail(), user.fullName(), user.getRole(), tenantId),
                "Login successful"));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<LoginResponse>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        String ip = clientIp(httpRequest);
        rateLimiter.checkBlocked("changepw", ip, request.email());

        User user = userService.loadByEmail(request.email());

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            rateLimiter.recordFailure("changepw", ip, request.email());
            throw new BadCredentialsException("Current password is incorrect");
        }

        rateLimiter.reset("changepw", ip, request.email());
        userService.changePassword(user.getId(), request.newPassword());

        String tenantId = TenantContext.getCurrentTenant();
        String token = jwtService.generateToken(user.getId(), user.getEmail(), tenantId, user.getRole());

        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(token, jwtExpiration).toString());

        return ResponseEntity.ok(ApiResponse.ok(
                new LoginResponse(user.getEmail(), user.fullName(), user.getRole(), tenantId),
                "Password changed successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse>> getMe(@AuthenticationPrincipal SecurityUser principal) {
        User user = userService.loadByEmail(principal.email());
        String tenantId = principal.tenantId();
        return ResponseEntity.ok(ApiResponse.ok(
                new LoginResponse(user.getEmail(), user.fullName(), user.getRole(), tenantId),
                "OK"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("", 0).toString());
        return ResponseEntity.noContent().build();
    }

    private String clientIp(HttpServletRequest request) {
        return ClientIpResolver.resolve(request);
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
