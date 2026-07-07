package com.klassa.platform;

import com.klassa.user.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PlatformDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(PlatformDataInitializer.class);

    private final PlatformUserRepository platformUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminFirstName;
    private final String adminLastName;

    public PlatformDataInitializer(PlatformUserRepository platformUserRepository,
                                   PasswordEncoder passwordEncoder,
                                   @Value("${platform.admin.email:}") String adminEmail,
                                   @Value("${platform.admin.password:}") String adminPassword,
                                   @Value("${platform.admin.first-name:Platform}") String adminFirstName,
                                   @Value("${platform.admin.last-name:Admin}") String adminLastName) {
        this.platformUserRepository = platformUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminFirstName = adminFirstName;
        this.adminLastName = adminLastName;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            log.warn("PLATFORM_ADMIN_EMAIL or PLATFORM_ADMIN_PASSWORD not set — skipping platform admin seed");
            return;
        }

        if (platformUserRepository.existsByEmail(adminEmail)) {
            log.info("Platform admin '{}' already exists — skipping seed", adminEmail);
            return;
        }

        PlatformUser admin = new PlatformUser();
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setFirstName(adminFirstName);
        admin.setLastName(adminLastName);
        admin.setRole(UserRole.PLATFORM_ADMIN);
        admin.setActive(true);
        platformUserRepository.save(admin);

        log.info("Platform admin '{}' created — change password immediately in production", adminEmail);
    }
}
