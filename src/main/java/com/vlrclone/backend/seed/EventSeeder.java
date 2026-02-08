package com.vlrclone.backend.seed;

import com.vlrclone.backend.Enums.EventCategory;
import com.vlrclone.backend.Enums.EventVisibility;
import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.ClubRepository;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class EventSeeder {

    private final EventRepository eventRepo;
    private final ClubRepository clubRepo;
    private final UserRepository userRepo;

    public EventSeeder(
            EventRepository eventRepo,
            ClubRepository clubRepo,
            UserRepository userRepo
    ) {
        this.eventRepo = eventRepo;
        this.clubRepo = clubRepo;
        this.userRepo = userRepo;
    }

    public void seed() {
        if (eventRepo.count() > 0) return;

        Club football = clubRepo.findByName("Informatics Football")
                .orElseThrow(() ->
                        new IllegalStateException("Football club missing — ClubSeeder failed")
                );

        User admin = userRepo.findByEmail("admin@example.com")
                .orElseThrow(() ->
                        new IllegalStateException("Admin user missing — AdminBootstrap failed")
                );

        eventRepo.save(new Event(
                "5-a-side Match",
                "Weekly informatics football session",
                "Sports Hall",
                LocalDateTime.now().plusDays(3),
                LocalDateTime.now().plusDays(3).plusHours(2),
                EventCategory.INTERNAL,
                EventVisibility.PUBLIC,
                football,
                admin
        ));

        eventRepo.save(new Event(
                "Hackathon Kickoff",
                "University-wide hackathon introduction",
                "Main Lecture Theatre",
                LocalDateTime.now().plusDays(7),
                LocalDateTime.now().plusDays(7).plusHours(3),
                EventCategory.INTERNAL,
                EventVisibility.PUBLIC,
                null, // public event, not tied to a club
                admin
        ));

        System.out.println("Seeded events");
    }
}
