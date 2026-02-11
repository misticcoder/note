package com.vlrclone.backend.seed;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventAttendance;
import com.vlrclone.backend.model.EventRating;
import com.vlrclone.backend.repository.EventAttendanceRepository;
import com.vlrclone.backend.repository.EventRatingRepository;
import com.vlrclone.backend.repository.EventRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Order(7)
@Component
public class EventRatingSeeder {

    private final EventRatingRepository ratingRepo;
    private final EventRepository eventRepo;
    private final EventAttendanceRepository attendanceRepo;

    private final Random random = new Random();

    public EventRatingSeeder(
            EventRatingRepository ratingRepo,
            EventRepository eventRepo,
            EventAttendanceRepository attendanceRepo
    ) {
        this.ratingRepo = ratingRepo;
        this.eventRepo = eventRepo;
        this.attendanceRepo = attendanceRepo;
    }

    public void seed() {

        if (ratingRepo.count() > 0) return;

        List<Event> events = eventRepo.findAll();

        for (Event event : events) {

            // Only rate past events
            if (event.getStartAt().isAfter(LocalDateTime.now())) {
                continue;
            }

            // Get attendees who actually attended
            List<EventAttendance> attendees = attendanceRepo.findAll().stream()
                    .filter(a -> a.getEvent().getId().equals(event.getId()))
                    .filter(a -> a.getStatus().name().equals("ATTENDED"))
                    .toList();

            // 60-80% of attendees leave ratings
            int raterCount = (int) (attendees.size() * (0.6 + random.nextDouble() * 0.2));

            for (int i = 0; i < raterCount && i < attendees.size(); i++) {

                EventAttendance attendance = attendees.get(i);

                EventRating rating = new EventRating();
                rating.setEvent(event);
                rating.setUser(attendance.getUser());

                // Rating distribution: mostly positive (3-5 stars)
                double rand = random.nextDouble();
                if (rand < 0.50) {
                    rating.setRating(5); // 50% give 5 stars
                } else if (rand < 0.75) {
                    rating.setRating(4); // 25% give 4 stars
                } else if (rand < 0.90) {
                    rating.setRating(3); // 15% give 3 stars
                } else if (rand < 0.97) {
                    rating.setRating(2); // 7% give 2 stars
                } else {
                    rating.setRating(1); // 3% give 1 star
                }

                rating.setCreatedAt(event.getEndAt().plusHours(random.nextInt(48)));
                rating.setUpdatedAt(rating.getCreatedAt());

                ratingRepo.save(rating);
            }
        }
    }
}