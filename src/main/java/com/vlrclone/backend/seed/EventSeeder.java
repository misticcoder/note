package com.vlrclone.backend.seed;

import com.vlrclone.backend.Enums.EventCategory;
import com.vlrclone.backend.Enums.EventVisibility;
import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Tag;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.ClubRepository;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.TagRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Order(5)
@Component
public class EventSeeder {

    private final EventRepository eventRepo;
    private final ClubRepository clubRepo;
    private final UserRepository userRepo;
    private final TagRepository tagRepo;

    public EventSeeder(
            EventRepository eventRepo,
            ClubRepository clubRepo,
            UserRepository userRepo,
            TagRepository tagRepo
    ) {
        this.eventRepo = eventRepo;
        this.clubRepo = clubRepo;
        this.userRepo = userRepo;
        this.tagRepo = tagRepo;
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

        // ========================================
        // 🔹 TAG GROUPS
        // ========================================

        String[][] internalTagGroups = {
                {"football", "futsal", "5-a-side"},
                {"machine learning", "ai", "data"},
                {"networking", "careers"},
                {"beginner", "workshop"},
                {"social", "community"},
                {"software", "development"},
                {"teamwork", "practice"},
                {"project", "collaboration"},
                {"leadership"},
                {"q&a", "discussion"}
        };

        String[][] externalTagGroups = {
                {"hackathon", "coding", "competition"},
                {"networking", "industry"},
                {"ai", "research"},
                {"startup", "entrepreneurship"},
                {"diversity", "women in tech"},
                {"cybersecurity", "security"},
                {"careers", "software engineering"},
                {"data science"},
                {"open source", "github"},
                {"entrepreneurship", "business"}
        };

        // ========================================
        // 🔹 INTERNAL EVENTS
        // ========================================

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

            Set<Tag> tags = resolveTags(
                    internalTagGroups[i % internalTagGroups.length]
            );

            Event event = new Event(
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
                    admin,
                    tags
            );

            eventRepo.save(event);
        }

        // ========================================
        // 🔹 EXTERNAL EVENTS
        // ========================================

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

            Set<Tag> tags = resolveTags(
                    externalTagGroups[i % externalTagGroups.length]
            );

            Event event = new Event(
                    externalTitles[i],
                    "A university-wide event open to all students. Includes networking, workshops and guest speakers.",
                    externalLocations[random.nextInt(externalLocations.length)],
                    start,
                    end,
                    EventCategory.EXTERNAL,
                    EventVisibility.PUBLIC,
                    null,
                    admin,
                    tags
            );

            eventRepo.save(event);
        }

        // ========================================
        // 🔹 PAST EVENTS
        // ========================================

        for (int i = 0; i < 3; i++) {

            Club club = clubs.get(i % clubs.size());

            LocalDateTime start = LocalDateTime.now().minusDays(10 + i * 3);
            LocalDateTime end = start.plusHours(2);

            Set<Tag> tags = resolveTags(new String[]{"community", "archive"});

            Event event = new Event(
                    "Past Event " + (i + 1),
                    "Previously held session for members.",
                    "Room 2" + i,
                    start,
                    end,
                    EventCategory.INTERNAL,
                    EventVisibility.PUBLIC,
                    club,
                    admin,
                    tags
            );

            eventRepo.save(event);
        }
    }

    // ==========================================================
    // 🔹 RESOLVE TAGS (Ensures Reuse + No Duplicates)
    // ==========================================================

    private Set<Tag> resolveTags(String[] tagNames) {

        Set<Tag> tags = new HashSet<>();

        for (String raw : tagNames) {

            String normalized = raw.trim().toLowerCase();

            Tag tag = tagRepo.findByNameIgnoreCase(normalized)
                    .orElseGet(() -> tagRepo.save(new Tag(normalized)));

            tags.add(tag);
        }

        return tags;
    }
}
