package com.quickserve.admin.config;

import com.quickserve.admin.entity.Role;
import com.quickserve.admin.entity.User;
import com.quickserve.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a default admin account so Member 4's dashboard can be logged into
 * immediately: admin@quickserve.com / Admin@123
 * Remove or gate this behind a profile before shipping to production.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@quickserve.com")) {
            User admin = User.builder()
                    .name("Canteen Admin")
                    .email("admin@quickserve.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .blocked(false)
                    .build();
            userRepository.save(admin);
            System.out.println(">>> Seeded default admin login: admin@quickserve.com / Admin@123");
        }
    }
}
