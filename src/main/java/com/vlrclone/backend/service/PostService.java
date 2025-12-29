package com.vlrclone.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vlrclone.backend.Enums.ReferenceType;
import com.vlrclone.backend.dto.PostFeedDto;
import com.vlrclone.backend.model.*;
import com.vlrclone.backend.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class PostService {

    private final PostRepository posts;
    private final PostLikeRepository likes;
    private final CommentRepository comments;
    private final ClubRepository clubs;
    private final EventRepository events;
    private final ThreadRepository threads;
    private final ObjectMapper objectMapper;
    private final ReferenceRepository references;
    private final UserRepository users;


    public PostService(
            PostRepository posts,
            PostLikeRepository likes,
            CommentRepository comments,
            ClubRepository clubs,
            EventRepository events,
            ThreadRepository threads, ObjectMapper objectMapper, ReferenceRepository references, UserRepository users
    ) {
        this.posts = posts;
        this.likes = likes;
        this.comments = comments;
        this.clubs = clubs;
        this.events = events;
        this.threads = threads;
        this.objectMapper = objectMapper;
        this.references = references;
        this.users = users;
    }

    /* ===================== FEED ===================== */

    public List<PostFeedDto> getFeed(String username, Long eventId) {
        List<Post> rawPosts;

        if (eventId != null) {
            rawPosts = posts.findByEventIdOrderByCreatedAtDesc(eventId);
        } else {
            rawPosts = posts.findByEventIsNullOrderByCreatedAtDesc();
        }

        LocalDateTime now = LocalDateTime.now();
        boolean isAdmin = username != null && isAdmin(username);

        return rawPosts.stream()
                .filter(p -> {
                    // always visible
                    if (p.getPublishAt() == null) return true;

                    // already published
                    if (!p.getPublishAt().isAfter(now)) return true;

                    // scheduled — admins only
                    return isAdmin;
                })
                .sorted((a, b) -> {
                    if (a.isAnnouncement() && !b.isAnnouncement()) return -1;
                    if (!a.isAnnouncement() && b.isAnnouncement()) return 1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(p -> toFeedDto(p, username))
                .toList();
    }



    /* ===================== LIKE ===================== */

    public void like(Long postId, String username) {
        if (!likes.existsByPostIdAndUsername(postId, username)) {
            Post post = posts.findById(postId).orElseThrow();
            likes.save(new PostLike(post, username));
        }
    }

    public void unlike(Long postId, String username) {
        likes.deleteByPostIdAndUsername(postId, username);
    }

    /* ===================== DELETE POST ===================== */

    public void deletePost(Long postId, String requesterUsername, boolean isAdmin) {
        Post post = posts.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!isAdmin && !post.getAuthor().equals(requesterUsername)) {
            throw new RuntimeException("Not allowed");
        }

        // delete image files
        post.getImages().forEach(img -> deleteImageFile(img.getUrl()));

        likes.deleteAllByPostId(postId);
        comments.deleteAllByPostId(postId);
        posts.delete(post);
    }

    /* ===================== FILE CLEANUP ===================== */

    public void deleteImageFile(String imageUrl) {
        try {
            if (imageUrl == null || imageUrl.isBlank()) return;

            Path path = Paths.get(imageUrl.substring(1)); // remove leading /
            if (Files.exists(path)) {
                Files.delete(path);
            }
        } catch (Exception e) {
            // intentionally silent – file cleanup must not fail request
            System.err.println("Failed to delete image file: " + imageUrl);
        }
    }

    /* ===================== DTO MAPPER ===================== */

    public PostFeedDto toFeedDto(Post post, String username) {
        return new PostFeedDto(
                post.getId(),
                post.getAuthor(),
                post.getContent(),

                // images
                post.getImages()
                        .stream()
                        .sorted(Comparator.comparingInt(PostImage::getPosition))
                        .map(img -> new PostFeedDto.ImageDto(
                                img.getId(),
                                img.getUrl()
                        ))
                        .toList(),

                // references
                post.getReferences()
                        .stream()
                        .map(ref -> new PostFeedDto.ReferenceDto(
                                ref.getType(),
                                ref.getTargetId(),
                                ref.getDisplayText()
                        ))
                        .toList(),

                post.getCreatedAt(),
                post.getPublishAt(),          // ✅ THIS IS THE KEY LINE

                likes.countByPostId(post.getId()),
                username != null &&
                        likes.existsByPostIdAndUsername(post.getId(), username),
                comments.countByPostIdAndParentIdIsNull(post.getId()),
                post.isPinned(),
                post.getShareCount()
        );
    }




    public List<Map<String, Object>> searchReferences(String q) {
        if (q == null || q.isBlank()) return List.of();

        List<Map<String, Object>> results = new ArrayList<>();

        clubs.findTop10ByNameContainingIgnoreCase(q)
                .forEach(c ->
                        results.add(Map.of(
                                "type", "CLUB",
                                "targetId", c.getId(),
                                "displayText", c.getName()
                        ))
                );

        events.findTop10ByTitleContainingIgnoreCase(q)
                .forEach(e ->
                        results.add(Map.of(
                                "type", "EVENT",
                                "targetId", e.getId(),
                                "displayText", e.getTitle()
                        ))
                );

        threads.findTop10ByTitleContainingIgnoreCase(q)
                .forEach(t ->
                        results.add(Map.of(
                                "type", "THREAD",
                                "targetId", t.getId(),
                                "displayText", t.getTitle()
                        ))
                );

        return results;
    }

    public List<PostReference> parseReferences(String json) {

        if (json == null || json.isBlank()) {
            return List.of();
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> raw = mapper.readValue(json, List.class);

            List<PostReference> refs = new ArrayList<>();

            for (Map<String, Object> r : raw) {
                PostReference ref = new PostReference();
                ref.setType(ReferenceType.valueOf(r.get("type").toString()));
                ref.setTargetId(Long.valueOf(r.get("targetId").toString()));
                ref.setDisplayText(r.get("displayText").toString());
                refs.add(ref);
            }

            return refs;
        } catch (Exception e) {
            throw new RuntimeException("Invalid references payload", e);
        }
    }
    @Transactional
    public Post updatePost(
            Long postId,
            String content,
            List<PostReference> incomingReferences
    ) {
        Post post = posts.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setContent(content);

        // 🔥 HARD REPLACE REFERENCES
        references.deleteByPostId(postId);

        if (incomingReferences != null && !incomingReferences.isEmpty()) {
            for (PostReference ref : incomingReferences) {
                ref.setPost(post);
            }
            references.saveAll(incomingReferences);
        }

        return posts.save(post);
    }

    public boolean isAdmin(String username) {
        return users.findByUsername(username)
                .map(u -> u.getRole() == User.Role.ADMIN)
                .orElse(false);
    }



}
