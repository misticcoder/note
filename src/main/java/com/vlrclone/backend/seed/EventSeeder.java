package com.vlrclone.backend.seed;

import com.vlrclone.backend.Enums.EventCategory;
import com.vlrclone.backend.Enums.EventVisibility;
import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.ClubRepository;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Order(5)
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

        User admin = userRepo.findByEmail("admin@example.com")
                .orElseThrow(() -> new IllegalStateException("Admin missing"));

        List<Club> clubs = clubRepo.findAll();

        if (clubs.isEmpty()) {
            throw new IllegalStateException("No clubs found — ClubSeeder must run before EventSeeder");
        }

        Random random = new Random();

        // ================================
        // 🔹 INTERNAL CLUB EVENTS
        // ================================
        String[] internalTitles = {
                "Weekly Training Session",
                "Strategy Workshop",
                "Guest Speaker Talk",
                "Beginner Bootcamp",
                "Social Night",
                "Skill Development Session",
                "Team Practice",
                "Project Collaboration Meetup",
                "Leadership Meeting",
                "Member Q&A Session"
        };

        String[] internalLocations = {
                "Room 101",
                "Seminar Room B2",
                "Engineering Lab 3",
                "Sports Hall",
                "Innovation Hub",
                "Library Study Room 4"
        };

        for (int i = 0; i < 10; i++) {

            Club club = clubs.get(i % clubs.size());

            LocalDateTime start = LocalDateTime.now().plusDays(i + 2);
            LocalDateTime end = start.plusHours(2 + random.nextInt(2));

            eventRepo.save(new Event(
                    internalTitles[i],
                    "Organised by " + club.getName() +
                            ". Open to members for collaboration, networking and skill development.",
                    internalLocations[random.nextInt(internalLocations.length)],
                    start,
                    end,
                    EventCategory.INTERNAL,
                    (i % 2 == 0)
                            ? EventVisibility.PUBLIC
                            : EventVisibility.CLUB_MEMBERS,
                    club,
                    admin
            ));
        }

        // ================================
        // 🔹 EXTERNAL / UNIVERSITY EVENTS
        // ================================
        String[] externalTitles = {
                "University Hackathon 2026",
                "Tech Industry Networking Fair",
                "AI Research Symposium",
                "Startup Pitch Competition",
                "Women in Tech Panel",
                "Cybersecurity Awareness Day",
                "Careers in Software Engineering",
                "Data Science Masterclass",
                "Open Source Contribution Workshop",
                "Entrepreneurship Bootcamp"
        };

        String[] externalLocations = {
                "Main Auditorium",
                "Conference Centre",
                "Innovation Theatre",
                "Central Campus Hall",
                "Business School Atrium"
        };

        for (int i = 0; i < 10; i++) {

            LocalDateTime start = LocalDateTime.now().plusDays(15 + i * 3);
            LocalDateTime end = start.plusHours(4);

            eventRepo.save(new Event(
                    externalTitles[i],
                    "A university-wide event open to all students. Includes networking, workshops and guest speakers.",
                    externalLocations[random.nextInt(externalLocations.length)],
                    start,
                    end,
                    EventCategory.EXTERNAL,
                    EventVisibility.PUBLIC,
                    null,
                    admin
            ));
        }

        // ================================
        // 🔹 Some Past Events (for realism)
        // ================================
        for (int i = 0; i < 3; i++) {

            Club club = clubs.get(i % clubs.size());

            LocalDateTime start = LocalDateTime.now().minusDays(10 + i * 3);
            LocalDateTime end = start.plusHours(2);

            eventRepo.save(new Event(
                    "Past Event " + (i + 1),
                    "Previously held session for members.",
                    "Room 2" + i,
                    start,
                    end,
                    EventCategory.INTERNAL,
                    EventVisibility.PUBLIC,
                    club,
                    admin
            ));
        }
    }
}
