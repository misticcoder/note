// com.vlrclone.backend.config.AdminBootstrap.java
package com.vlrclone.backend.config;

import com.vlrclone.backend.model.User;
import com.vlrclone.backend.model.User.Role;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminBootstrap {

    @Bean
    CommandLineRunner ensureAdmin(UserRepository users) {
        return args -> {
            final String email = "admin@example.com";
            if (users.findByEmail(email).isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail(email);
                admin.setPassword("admin123"); // plain text for prototype only
                admin.setRole(User.Role.ADMIN);
                admin.setProtectedAccount(true);

// Optional profile defaults
                admin.setDisplayName("Admin");
                admin.setParticipationScore(0);

                users.save(admin);

                users.save(admin);
                System.out.println("Seeded protected admin: " + email);
            }
        };
    }
}
