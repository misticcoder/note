package com.vlrclone.backend.seed;

import com.vlrclone.backend.Enums.ReferenceType;
import com.vlrclone.backend.model.*;
import com.vlrclone.backend.repository.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Component
public class PostSeeder {

    private final PostRepository postRepo;
    private final UserRepository userRepo;
    private final EventRepository eventRepo;
    private final ClubRepository clubRepo;

    private final Random random = new Random();

    public PostSeeder(
            PostRepository postRepo,
            UserRepository userRepo,
            EventRepository eventRepo,
            ClubRepository clubRepo
    ) {
        this.postRepo = postRepo;
        this.userRepo = userRepo;
        this.eventRepo = eventRepo;
        this.clubRepo = clubRepo;
    }

    public void seed() {
        if (postRepo.count() > 0) return;

        List<User> users = userRepo.findAll();
        List<Event> events = eventRepo.findAll();
        List<Club> clubs = clubRepo.findAll();

        if (users.isEmpty()) return;

        for (int i = 0; i < 20; i++) {

            User author = users.get(random.nextInt(users.size()));

            Post post = new Post();
            post.setAuthor(author.getUsername());
            post.setContent(generateContent(i));
            post.setPublishAt(LocalDateTime.now().minusDays(random.nextInt(10)));

            // 30% chance of announcement
            if (random.nextDouble() < 0.3) {
                post.setAnnouncement(true);
            }

            // 20% chance pinned
            if (random.nextDouble() < 0.2) {
                post.setPinned(true);
                post.setPinnedAt(LocalDateTime.now());
            }

            // Attach event (if exists)
            if (!events.isEmpty() && random.nextDouble() < 0.5) {
                Event event = events.get(random.nextInt(events.size()));
                post.setEvent(event);
            }

            // Add references (club or event)
            if (!clubs.isEmpty() && random.nextDouble() < 0.6) {
                Club club = clubs.get(random.nextInt(clubs.size()));

                PostReference ref = new PostReference();
                ref.setType(ReferenceType.CLUB);
                ref.setTargetId(club.getId());
                ref.setDisplayText(club.getName());

                post.addReference(ref);
            }

            if (!events.isEmpty() && random.nextDouble() < 0.6) {
                Event event = events.get(random.nextInt(events.size()));

                PostReference ref = new PostReference();
                ref.setType(ReferenceType.EVENT);
                ref.setTargetId(event.getId());
                ref.setDisplayText(event.getTitle());

                post.addReference(ref);
            }

            postRepo.save(post);
        }
    }

    private String generateContent(int i) {
        String[] samples = {
                "Looking forward to this event!",
                "Great turnout today 🔥",
                "Don’t forget to register.",
                "Massive thanks to everyone who came!",
                "This club is growing fast.",
                "Reminder: event starts at 6PM.",
                "Photos will be uploaded soon.",
                "We need volunteers for next week.",
                "Who’s attending?",
                "Big announcement coming soon 👀"
        };

        return samples[i % samples.length];
    }
}
