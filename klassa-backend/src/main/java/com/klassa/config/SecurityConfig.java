package com.klassa.config;

import com.klassa.shared.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_PATHS = {
            "/api/plans",
            "/api/auth/login",
            "/api/auth/logout",
            "/api/auth/change-password",
            "/api/platform/auth/login",
            "/actuator/health",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/api-docs/**"
    };

    /**
     * CSRF strategy:
     *
     * The JWT cookie is set with `SameSite=Lax` + `path=/api` (see
     * `AuthController#buildCookie`). `SameSite=Lax` already blocks the browser
     * from sending the cookie on cross-origin POST/PUT/PATCH/DELETE — that's
     * the primary defense against CSRF and is what OWASP recommends for
     * SPAs that rely on cookie auth + state-changing APIs.
     *
     * CSRF tokens (double-submit cookie pattern) are intentionally NOT
     * enabled here because the frontend and backend run on different origins
     * (`localhost:3000` vs `localhost:8080`). The CSRF token would be set on
     * the backend's domain and never reach the frontend's Server Actions,
     * which would break every state-changing request. The two viable paths
     * to enable CSRF later are:
     *   1. Proxy `/api/*` through Next.js so the app is same-origin, then
     *      re-enable the block below and wire the frontend `csrf.ts` helper.
     *   2. Set `SameSite=None; Secure` on the CSRF cookie (kills the dev
     *      experience — `Secure` requires HTTPS).
     *
     * When the JWT cookie is rotated to `SameSite=Strict` (or when the app
     * becomes same-origin), revisit this and re-enable CSRF.
     */
    /*
    private static final String[] CSRF_EXEMPT_PATHS = {
            "/api/auth/login",
            "/api/auth/change-password",
            "/api/auth/logout",
            "/api/platform/auth/login"
    };
    */

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter,
            CorsConfigurationSource corsConfigurationSource) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000)))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_PATHS).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${cors.allowed-origins}") String allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization", "Accept", "X-Tenant-Subdomain"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
