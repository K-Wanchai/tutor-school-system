package com.tutorschool.backend.seeder;

import com.tutorschool.backend.entity.Role;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_EMAIL    = "admin@tutorschool.com";
    private static final String ADMIN_PASSWORD = "admin123";

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.existsByUsername(ADMIN_USERNAME)) {
            log.info("[Seeder] Admin '{}' already exists — skipped", ADMIN_USERNAME);
            return;
        }

        User admin = User.builder()
                .username(ADMIN_USERNAME)
                .email(ADMIN_EMAIL)
                .password(passwordEncoder.encode(ADMIN_PASSWORD))
                .role(Role.ADMIN)
                .build();

        userRepository.save(admin);
        log.info("[Seeder] Default admin created — username: '{}', email: '{}'",
                ADMIN_USERNAME, ADMIN_EMAIL);
    }
}
