package com.vlrclone.backend.config;

import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrap {

    @Bean
    @Order(1)
    CommandLineRunner ensureAdmin(
            UserRepository users,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {

            final String email = "admin@example.com";

            if (users.findByEmail(email).isPresent()) {
                System.out.println("✅ Admin account already exists: " + email);
                return; // admin already exists
            }

            User admin = new User(
                    "admin",                              // username
                    email,
                    passwordEncoder.encode("admin123"),  // encoded password
                    User.Role.ADMIN
            );

            admin.setProtectedAccount(true);
            admin.setDisplayName("Admin");
            admin.setParticipationScore(0);
            admin.setAvatarUrl("https://i.pravatar.cc/150?img=0");

            users.save(admin);

            System.out.println("✅ Seeded protected admin account: " + email);
        };
    }
}