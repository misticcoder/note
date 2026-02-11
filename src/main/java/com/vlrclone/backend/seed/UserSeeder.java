package com.vlrclone.backend.seed;

import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Order(1)
@Component
public class UserSeeder {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    public UserSeeder(UserRepository userRepo, PasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.encoder = encoder;
    }

    public void seed() {

        for (int i = 1; i <= 30; i++) {
            createIfMissing(
                    "student" + i + "@uni.ac.uk",
                    "student" + i,
                    "Student " + i,
                    User.Role.STUDENT,
                    false
            );
        }
    }

    private void createIfMissing(
            String email,
            String username,
            String displayName,
            User.Role role,
            boolean protectedAccount
    ) {
        if (userRepo.findByEmail(email).isPresent()) return;

        User user = new User(
                username,
                email,
                encoder.encode("password"),
                role
        );

        user.setDisplayName(displayName);
        user.setProtectedAccount(protectedAccount);

        userRepo.save(user);
    }
}
