package com.vlrclone.backend.seed;

import com.vlrclone.backend.model.Thread;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.ThreadRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Order(9)
@Component
public class ThreadSeeder {

    private final ThreadRepository threadRepo;
    private final UserRepository userRepo;

    public ThreadSeeder(ThreadRepository threadRepo, UserRepository userRepo) {
        this.threadRepo = threadRepo;
        this.userRepo = userRepo;
    }

    public void seed() {

        if (threadRepo.count() >= 10) return;

        List<User> users = userRepo.findAll();
        if (users.isEmpty()) return;

        Collections.shuffle(users);
        Random random = new Random();

        String[] titles = {
                "Best places to study on campus?",
                "Anyone going to the football session?",
                "Hackathon tips for beginners",
                "Looking for AI project teammates",
                "Thoughts on the new timetable?",
                "Club recommendations?",
                "Internship advice for first years",
                "Best budget food near campus",
                "Exam revision strategies",
                "Is attendance worth it?"
        };

        String[] contents = {
                "I'm trying to find quiet spots for revision. Any hidden gems?",
                "Thinking of joining this week — how competitive is it?",
                "What tech stack are most teams using this year?",
                "Would love to collaborate on something ML-related.",
                "Anyone else finding it overloaded?",
                "Looking to join something social but not too intense.",
                "How early should we apply?",
                "Drop your favourites 👇",
                "What worked best for you last semester?",
                "Curious about everyone's experience."
        };

        for (int i = 0; i < 10; i++) {

            User author = users.get(random.nextInt(users.size()));

            Thread thread = new Thread();
            thread.setTitle(titles[i]);
            thread.setContent(contents[i]);
            thread.setAuthor(author.getUsername());
            thread.setPublished(
                    LocalDateTime.now()
                            .minusDays(random.nextInt(30))
                            .atZone(java.time.ZoneId.systemDefault())
                            .toInstant()
            );


            threadRepo.save(thread);
        }
    }
}
