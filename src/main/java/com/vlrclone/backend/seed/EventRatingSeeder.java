package com.vlrclone.backend.seed;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventRating;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.EventRatingRepository;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Random;

@Order(6)
@Component
public class EventRatingSeeder {

    private final EventRepository eventRepo;
    private final UserRepository userRepo;
    private final EventRatingRepository ratingRepo;

    public EventRatingSeeder(
            EventRepository eventRepo,
            UserRepository userRepo,
            EventRatingRepository ratingRepo
    ) {
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
        this.ratingRepo = ratingRepo;
    }

    public void seed() {

        if (ratingRepo.count() > 0) return;

        Random random = new Random();

        for (Event event : eventRepo.findAll()) {

            List<User> users = userRepo.findAll();
            Collections.shuffle(users);

            for (int i = 0; i < 10 && i < users.size(); i++) {

                EventRating rating = new EventRating();
                rating.setEvent(event);
                rating.setUser(users.get(i));
                rating.setRating(1 + random.nextInt(5));

                ratingRepo.save(rating);
            }
        }
    }
}
