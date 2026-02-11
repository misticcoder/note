package com.vlrclone.backend.seed;

import com.vlrclone.backend.Enums.NotificationType;
import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Notification;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.*;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Order(9)
@Component
public class NotificationSeeder {

    private final NotificationRepository notificationRepo;
    private final UserRepository userRepo;
    private final EventRepository eventRepo;
    private final ClubRepository clubRepo;

    private final Random random = new Random();

    public NotificationSeeder(
            NotificationRepository notificationRepo,
            UserRepository userRepo,
            EventRepository eventRepo,
            ClubRepository clubRepo
    ) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
        this.eventRepo = eventRepo;
        this.clubRepo = clubRepo;
    }

    public void seed() {

        if (notificationRepo.count() > 0) return;

        List<User> users = userRepo.findAll();
        List<Event> events = eventRepo.findAll();
        List<Club> clubs = clubRepo.findAll();

        if (users.isEmpty()) return;

        Collections.shuffle(users);

        // =========================================
        // EVENT-RELATED NOTIFICATIONS
        // =========================================
        if (!events.isEmpty()) {
            for (int i = 0; i < Math.min(20, events.size() * 3); i++) {

                Event event = events.get(random.nextInt(events.size()));
                User user = users.get(random.nextInt(users.size()));

                Notification notification = new Notification();
                notification.setUser(user);
                notification.setRelatedEventId(event.getId());
                notification.setRead(random.nextDouble() < 0.6); // 60% read
                notification.setCreatedAt(
                        event.getStartAt().minusDays(random.nextInt(7))
                );

                // Random notification type
                double rand = random.nextDouble();
                if (rand < 0.40) {
                    notification.setType(NotificationType.EVENT_CREATED);
                    notification.setMessage("New event: " + event.getTitle());
                } else if (rand < 0.70) {
                    notification.setType(NotificationType.EVENT_INTERESTED);
                    notification.setMessage("Someone is interested in " + event.getTitle());
                } else if (rand < 0.85) {
                    notification.setType(NotificationType.EVENT_ANNOUNCEMENT);
                    notification.setMessage("Announcement for " + event.getTitle());
                } else {
                    notification.setType(NotificationType.EVENT_UPDATED);
                    notification.setMessage(event.getTitle() + " has been updated");
                }

                notificationRepo.save(notification);
            }
        }

        // =========================================
        // CLUB-RELATED NOTIFICATIONS
        // =========================================
        if (!clubs.isEmpty()) {
            for (int i = 0; i < Math.min(10, clubs.size() * 2); i++) {

                Club club = clubs.get(random.nextInt(clubs.size()));
                User user = users.get(random.nextInt(users.size()));

                Notification notification = new Notification();
                notification.setUser(user);
                notification.setRelatedClubId(club.getId());
                notification.setRead(random.nextDouble() < 0.5); // 50% read
                notification.setCreatedAt(
                        LocalDateTime.now().minusDays(random.nextInt(30))
                );

                double rand = random.nextDouble();
                if (rand < 0.50) {
                    notification.setType(NotificationType.CLUB_ANNOUNCEMENT);
                    notification.setMessage("New announcement from " + club.getName());
                } else {
                    notification.setType(NotificationType.CLUB_JOINED);
                    notification.setMessage("Welcome to " + club.getName() + "!");
                }

                notificationRepo.save(notification);
            }
        }

        // =========================================
        // COMMENT/POST NOTIFICATIONS
        // =========================================
        for (int i = 0; i < 15; i++) {

            User user = users.get(random.nextInt(users.size()));

            Notification notification = new Notification();
            notification.setUser(user);
            notification.setRead(random.nextDouble() < 0.4); // 40% read (newer)
            notification.setCreatedAt(
                    LocalDateTime.now().minusDays(random.nextInt(14))
            );

            double rand = random.nextDouble();
            if (rand < 0.33) {
                notification.setType(NotificationType.POST_COMMENTED);
                notification.setMessage("Someone commented on your post");
            } else if (rand < 0.66) {
                notification.setType(NotificationType.COMMENT_REPLY);
                notification.setMessage("New reply to your comment");
            } else {
                notification.setType(NotificationType.THREAD_COMMENTED);
                notification.setMessage("New comment on your thread");
            }

            notificationRepo.save(notification);
        }
    }
}