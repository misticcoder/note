package com.vlrclone.backend.seed;

import com.vlrclone.backend.model.Tag;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.TagRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Random;

@Order(2)
@Component
public class UserSeeder {

    private final UserRepository userRepo;
    private final TagRepository tagRepo;
    private final PasswordEncoder encoder;

    private final Random random = new Random();

    public UserSeeder(
            UserRepository userRepo,
            TagRepository tagRepo,
            PasswordEncoder encoder
    ) {
        this.userRepo = userRepo;
        this.tagRepo = tagRepo;
        this.encoder = encoder;
    }

    public void seed() {

        // Skip if we already have regular users (admin is created by AdminBootstrap)
        if (userRepo.count() > 1) return;

        List<Tag> tags = tagRepo.findAll();

        // =========================================
        // 🔹 REGULAR STUDENTS (Admin is created by AdminBootstrap @Order(1))
        // =========================================
        String[] firstNames = {
                "James", "Emma", "Oliver", "Sophia", "Liam",
                "Isabella", "Noah", "Mia", "Lucas", "Charlotte",
                "Ethan", "Amelia", "Daniel", "Ava", "Henry",
                "Grace", "Alexander", "Chloe", "Benjamin", "Ella"
        };

        String[] bios = {
                "Computer Science student passionate about AI and startups.",
                "Interested in machine learning and data science.",
                "Football enthusiast and club member.",
                "Love hackathons and competitive coding.",
                "Cybersecurity and networking nerd.",
                "Active in societies and student events.",
                "Enjoy building side projects and collaborating.",
                "Research-focused student exploring AI ethics.",
                "Social member involved in multiple clubs.",
                "Looking to connect with other tech enthusiasts."
        };

        for (int i = 0; i < 40; i++) {

            String firstName = firstNames[random.nextInt(firstNames.length)];
            String lastInitial = String.valueOf((char) ('A' + random.nextInt(26)));

            String username = (firstName + lastInitial + i).toLowerCase();
            String email = username + "@uni.ac.uk";

            if (userRepo.findByEmail(email).isPresent()) continue;

            User user = new User(
                    username,
                    email,
                    encoder.encode("password"),
                    User.Role.STUDENT
            );

            user.setDisplayName(firstName + " " + lastInitial + ".");
            user.setBio(bios[random.nextInt(bios.length)]);
            user.setProtectedAccount(false);

            // 🎯 Participation score distribution
            int score;
            if (random.nextDouble() < 0.2) {
                score = random.nextInt(50); // low engagement
            } else if (random.nextDouble() < 0.6) {
                score = 50 + random.nextInt(150); // medium
            } else {
                score = 200 + random.nextInt(300); // high performers
            }
            user.setParticipationScore(score);

            // 🎯 Avatar (placeholder)
            user.setAvatarUrl("https://i.pravatar.cc/150?img=" + (random.nextInt(70) + 1));

            // 🎯 Interest tags
            int tagCount = 1 + random.nextInt(3);
            for (int t = 0; t < tagCount && !tags.isEmpty(); t++) {
                user.getTags().add(tags.get(random.nextInt(tags.size())));
            }

            userRepo.save(user);
        }

        System.out.println("✅ Seeded " + 40 + " student users");
    }
}