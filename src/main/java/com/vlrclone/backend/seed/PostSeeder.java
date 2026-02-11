package com.vlrclone.backend.seed;

import com.vlrclone.backend.Enums.ReferenceType;
import com.vlrclone.backend.model.*;
import com.vlrclone.backend.repository.*;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Order(6)
@Component
public class PostSeeder {

    private final PostRepository postRepo;
    private final PostLikeRepository postLikeRepo;
    private final CommentRepository commentRepo;
    private final ClubRepository clubRepo;
    private final EventRepository eventRepo;
    private final UserRepository userRepo;

    private final Random random = new Random();

    public PostSeeder(
            PostRepository postRepo,
            PostLikeRepository postLikeRepo,
            CommentRepository commentRepo,
            ClubRepository clubRepo,
            EventRepository eventRepo,
            UserRepository userRepo
    ) {
        this.postRepo = postRepo;
        this.postLikeRepo = postLikeRepo;
        this.commentRepo = commentRepo;
        this.clubRepo = clubRepo;
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
    }

    public void seed() {

        if (postRepo.count() > 0) return;

        List<User> users = userRepo.findAll();
        List<Club> clubs = clubRepo.findAll();
        List<Event> events = eventRepo.findAll();

        if (users.isEmpty()) return;

        for (int i = 0; i < 20; i++) {

            User author = users.get(random.nextInt(users.size()));

            Post post = new Post();
            post.setAuthor(author.getUsername());
            post.setContent(generateContent(i));

            LocalDateTime created =
                    LocalDateTime.now().minusDays(random.nextInt(10))
                            .minusHours(random.nextInt(24));

            post.setPublishAt(created);
            post.setAnnouncement(random.nextBoolean());

            // Optional event attachment
            if (!events.isEmpty() && random.nextBoolean()) {
                post.setEvent(events.get(random.nextInt(events.size())));
            }

            // Images (cascade via Post)
            seedImages(post);

            // References (cascade via Post)
            seedReferences(post, clubs, events);

            // Random share count
            for (int s = 0; s < random.nextInt(5); s++) {
                post.incrementShareCount();
            }

            postRepo.save(post);

            // Engagement
            seedLikes(post, users);
            seedComments(post, users, created);
        }
    }

    // =========================================
    // Images
    // =========================================

    private void seedImages(Post post) {

        int imageCount = random.nextInt(3); // 0–2 images

        for (int i = 0; i < imageCount; i++) {
            PostImage image = new PostImage();
            image.setUrl("https://picsum.photos/800/400?random=" + random.nextInt(1000));
            image.setPosition(i);

            post.addImage(image); // important (sets relationship)
        }
    }

    // =========================================
    // References (Club/Event)
    // =========================================

    private void seedReferences(Post post, List<Club> clubs, List<Event> events) {

        if (!clubs.isEmpty() && random.nextBoolean()) {
            Club club = clubs.get(random.nextInt(clubs.size()));

            PostReference ref = new PostReference();
            ref.setType(ReferenceType.CLUB);
            ref.setTargetId(club.getId());
            ref.setDisplayText(club.getName());

            post.addReference(ref);
        }

        if (!events.isEmpty() && random.nextBoolean()) {
            Event event = events.get(random.nextInt(events.size()));

            PostReference ref = new PostReference();
            ref.setType(ReferenceType.EVENT);
            ref.setTargetId(event.getId());
            ref.setDisplayText(event.getTitle());

            post.addReference(ref);
        }
    }

    // =========================================
    // Likes
    // =========================================

    private void seedLikes(Post post, List<User> users) {

        int likeCount = random.nextInt(10);

        Collections.shuffle(users);

        for (int i = 0; i < Math.min(likeCount, users.size()); i++) {
            PostLike like = new PostLike(post, users.get(i).getUsername());
            postLikeRepo.save(like);
        }
    }

    // =========================================
    // Comments
    // =========================================

    private void seedComments(Post post, List<User> users, LocalDateTime baseTime) {

        int commentCount = random.nextInt(6);

        for (int i = 0; i < commentCount; i++) {

            User user = users.get(random.nextInt(users.size()));

            Comment comment = new Comment();
            comment.setPostId(post.getId());
            comment.setUsername(user.getUsername());
            comment.setComment(generateComment());
            comment.setCreatedAt(
                    baseTime.plusHours(random.nextInt(48))
            );

            commentRepo.save(comment);
        }
    }

    // =========================================
    // Content Generators
    // =========================================

    private String generateContent(int i) {
        String[] samples = {
                "Looking forward to this event!",
                "Great turnout today 🔥",
                "Don't forget to register.",
                "Massive thanks to everyone who came!",
                "This club is growing fast.",
                "Reminder: event starts at 6PM.",
                "Photos will be uploaded soon.",
                "We need volunteers for next week.",
                "Who's attending?",
                "Big announcement coming soon 👀"
        };

        return samples[i % samples.length];
    }

    private String generateComment() {
        String[] comments = {
                "This was amazing!",
                "Can’t wait for the next one.",
                "Thanks for organizing 🙌",
                "See you there!",
                "Is registration still open?",
                "Count me in!",
                "Loved this 🔥",
                "Well done everyone.",
                "This was super helpful.",
                "Looking forward to more events like this."
        };

        return comments[random.nextInt(comments.length)];
    }
}
