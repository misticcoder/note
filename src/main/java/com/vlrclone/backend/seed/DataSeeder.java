package com.vlrclone.backend.seed;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(
        prefix = "app.seed",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = false
)
public class DataSeeder implements CommandLineRunner {

    private final UserSeeder userSeeder;
    private final ClubSeeder clubSeeder;
    private final EventSeeder eventSeeder;

    public DataSeeder(
            UserSeeder userSeeder,
            ClubSeeder clubSeeder,
            EventSeeder eventSeeder
    ) {
        this.userSeeder = userSeeder;
        this.clubSeeder = clubSeeder;
        this.eventSeeder = eventSeeder;
    }

    @Override
    public void run(String... args) {
        userSeeder.seed();   // 1️⃣ USERS FIRST
        clubSeeder.seed();   // 2️⃣ CLUBS SECOND
        eventSeeder.seed();  // 3️⃣ EVENTS LAST
    }
}
