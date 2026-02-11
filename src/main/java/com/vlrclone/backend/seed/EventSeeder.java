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

@Order(4)
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

        int counter = 1;

        // 🔹 10 INTERNAL club events
        for (int i = 0; i < 10; i++) {

            Club club = clubs.get(i % clubs.size());

            eventRepo.save(new Event(
                    "Internal Event " + counter,
                    "Club organised session #" + counter,
                    "Room " + (100 + i),
                    LocalDateTime.now().plusDays(i + 1),
                    LocalDateTime.now().plusDays(i + 1).plusHours(2),
                    EventCategory.INTERNAL,
                    (i % 2 == 0)
                            ? EventVisibility.PUBLIC
                            : EventVisibility.CLUB_MEMBERS,
                    club,
                    admin
            ));

            counter++;
        }

        // 🔹 10 EXTERNAL public events
        for (int i = 0; i < 10; i++) {

            eventRepo.save(new Event(
                    "External Event " + counter,
                    "University-wide or external event #" + counter,
                    "Main Hall " + (i + 1),
                    LocalDateTime.now().plusDays(i + 15),
                    LocalDateTime.now().plusDays(i + 15).plusHours(4),
                    EventCategory.EXTERNAL,
                    EventVisibility.PUBLIC,
                    null,
                    admin
            ));

            counter++;
        }
    }
}
