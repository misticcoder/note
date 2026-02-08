// com.vlrclone.backend.config.AdminBootstrap.java
package com.vlrclone.backend.config;

import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Order(1)
public class AdminBootstrap {

    @Bean
    CommandLineRunner ensureAdmin(
            UserRepository users,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {

            final String email = "admin@example.com";

            if (users.findByEmail(email).isPresent()) {
                return; // ✅ admin already exists
            }

            User admin = new User(
                    "admin",                              // username
                    email,
                    passwordEncoder.encode("admin123"),  // ✅ encoded
                    User.Role.ADMIN
            );

            admin.setProtectedAccount(true);
            admin.setDisplayName("Admin");
            admin.setParticipationScore(0);

            users.save(admin);

            System.out.println("✅ Seeded protected admin account: " + email);
        };
    }
}
