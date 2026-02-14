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
    private final AttendanceSeeder attendanceSeeder;
    private final EventRatingSeeder eventRatingSeeder;
    private final PostSeeder postSeeder;
    private final NotificationSeeder notificationSeeder;
    private final ThreadSeeder threadSeeder;
    private final UserLoginDocumentSeeder userLoginDocumentSeeder;

    public DataSeeder(
            UserSeeder userSeeder,
            ClubSeeder clubSeeder,
            EventSeeder eventSeeder,
            AttendanceSeeder attendanceSeeder,
            EventRatingSeeder eventRatingSeeder,
            PostSeeder postSeeder,
            NotificationSeeder notificationSeeder,
            ThreadSeeder threadSeeder,
            UserLoginDocumentSeeder userLoginDocumentSeeder) {
        this.userSeeder = userSeeder;
        this.clubSeeder = clubSeeder;
        this.eventSeeder = eventSeeder;
        this.attendanceSeeder = attendanceSeeder;
        this.eventRatingSeeder = eventRatingSeeder;
        this.postSeeder = postSeeder;
        this.notificationSeeder = notificationSeeder;
        this.threadSeeder = threadSeeder;
        this.userLoginDocumentSeeder = userLoginDocumentSeeder;
    }

    @Override
    public void run(String... args) {

        // ───────────── BASE ENTITIES ─────────────
        userSeeder.seed();         // 1️⃣ USERS (required by almost everything)
        clubSeeder.seed();         // 2️⃣ CLUBS (required by events)

        // ───────────── CORE DOMAIN ─────────────
        eventSeeder.seed();        // 3️⃣ EVENTS (needs users + clubs)
        postSeeder.seed();         // 4️⃣ POSTS (needs users + maybe events)

        // ───────────── RELATIONAL / CHILD DATA ─────────────
        attendanceSeeder.seed();   // 5️⃣ EVENT_ATTENDANCE (needs events + users)
        eventRatingSeeder.seed();  // 6️⃣ EVENT_RATING (needs events + users)

        // ───────────── DEPENDENT / SIDE DATA ─────────────
        notificationSeeder.seed();
        threadSeeder.seed();//
        userLoginDocumentSeeder.seed();

    }
}
