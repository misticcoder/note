package com.vlrclone.backend.controller;

import com.vlrclone.backend.Enums.ReferenceType;
import com.vlrclone.backend.dto.PostFeedDto;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Post;
import com.vlrclone.backend.model.PostImage;
import com.vlrclone.backend.model.PostReference;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.PostRepository;
import com.vlrclone.backend.service.PostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "http://localhost:3000")
public class PostController {

    private final PostRepository posts;
    private final PostService service;
    private final EventRepository events;

    public PostController(PostRepository posts, PostService service, EventRepository events) {
        this.posts = posts;
        this.service = service;
        this.events = events;
    }

    /* ===================== FEED ===================== */

    @GetMapping("/{id}")
    public ResponseEntity<PostFeedDto> getPost(
            @PathVariable Long id,
            @RequestParam(required = false) String username
    ) {
        Post post = posts.findById(id).orElse(null);
        if (post == null) return ResponseEntity.notFound().build();

        return ResponseEntity.ok(service.toFeedDto(post, username));
    }

    @GetMapping
    public List<PostFeedDto> feed(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) Long eventId
    ) {
        return service.getFeed(username, eventId);
    }

    /* ===================== CREATE ===================== */

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> create(
            @RequestParam String author,
            @RequestParam String content,
            @RequestParam(required = false) List<MultipartFile> images,
            @RequestParam(required = false) String references,
            @RequestParam(required = false) Long eventId,
            @RequestParam(defaultValue = "false") boolean announcement,
            @RequestParam(required = false) String publishAt
    ) {
        boolean hasText = content != null && !content.isBlank();
        boolean hasImage = images != null && !images.isEmpty();

        if (author == null || author.isBlank() || (!hasText && !hasImage)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Post must contain text or image"));
        }


        if (announcement && !service.isAdmin(author)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Only admins can post announcements"));
        }



        Post post = new Post();
        post.setAuthor(author);
        post.setContent(content);
        post.setAnnouncement(announcement);

        if (publishAt != null && !publishAt.isBlank()) {
            post.setPublishAt(LocalDateTime.parse(publishAt));
        }

        if (post.getPublishAt() != null && !post.isAnnouncement()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Only announcements can be scheduled"));
        }



        /* ---------- EVENT ---------- */
        if (eventId != null) {
            Event event = events.findById(eventId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            post.setEvent(event);
        }

        /* ---------- IMAGES ---------- */
        if (images != null) {
            int position = 0;
            for (MultipartFile file : images) {
                if (file.isEmpty()) continue;

                String url = saveImage(file);

                PostImage img = new PostImage();
                img.setUrl(url);
                img.setPosition(position++);
                post.addImage(img);
            }
        }

        /* ---------- REFERENCES ---------- */
        if (references != null && !references.isBlank()) {
            service.parseReferences(references)
                    .forEach(post::addReference);
        }

        posts.save(post);
        return ResponseEntity.ok(service.toFeedDto(post, author));
    }



    /* ===================== LIKE ===================== */

    @PostMapping("/{id}/like")
    public void like(
            @PathVariable Long id,
            @RequestParam String username
    ) {
        service.like(id, username);
    }

    @DeleteMapping("/{id}/like")
    public void unlike(
            @PathVariable Long id,
            @RequestParam String username
    ) {
        service.unlike(id, username);
    }

    /* ===================== DELETE POST ===================== */

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @RequestParam String username,
            @RequestParam(defaultValue = "false") boolean admin
    ) {
        try {
            service.deletePost(id, username, admin);
            return ResponseEntity.ok(Map.of("status", "deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /* ===================== EDIT POST ===================== */

    @PatchMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> editPost(
            @PathVariable Long id,
            @RequestParam String username,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) List<String> removeImageIds,
            @RequestParam(required = false) List<String> imageOrder,
            @RequestParam(required = false) List<MultipartFile> images,
            @RequestParam(required = false) String references,
            @RequestParam(required = false) String publishAt
    ) {
        Post post = posts.findById(id).orElse(null);
        if (post == null) return ResponseEntity.notFound().build();

        if (!post.getAuthor().equals(username)) {
            return ResponseEntity.status(403).body(Map.of("message", "Not allowed"));
        }

        if (content != null) {
            if (content.length() > 500) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Content too long"));
            }
            post.setContent(content);
        }

        /* ---------- IMAGES ---------- */

        /* ---------- REMOVE IMAGES ---------- */
        if (removeImageIds != null && !removeImageIds.isEmpty()) {
            post.getImages()
                    .stream()
                    .filter(img ->
                            removeImageIds.contains(String.valueOf(img.getId()))
                    )
                    .toList()
                    .forEach(img -> {
                        service.deleteImageFile(img.getUrl());
                        post.removeImage(img);
                    });
        }

        /* ---------- REORDER EXISTING IMAGES ---------- */
        if (imageOrder != null && !imageOrder.isEmpty()) {
            int position = 0;
            for (String idStr : imageOrder) {
                Long imageId;
                try {
                    imageId = Long.valueOf(idStr);
                } catch (NumberFormatException e) {
                    continue;
                }

                for (PostImage img : post.getImages()) {
                    if (img.getId().equals(imageId)) {
                        img.setPosition(position++);
                        break;
                    }
                }
            }
        }

        /* ---------- ADD NEW IMAGES ---------- */
        if (images != null && !images.isEmpty()) {
            int startPosition = post.getImages().size();

            for (MultipartFile file : images) {
                if (file.isEmpty()) continue;

                String url = saveImage(file);

                PostImage img = new PostImage();
                img.setUrl(url);
                img.setPosition(startPosition++);

                post.addImage(img);
            }
        }

        /* ---------- REFERENCES (REPLACE) ---------- */
        if (references != null) {
            post.clearReferences();

            if (!references.isBlank()) {
                service.parseReferences(references)
                        .forEach(post::addReference);
            }
        }

        if (publishAt != null) {
            if (!service.isAdmin(username)) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Only admins can reschedule announcements"));
            }

            try {
                post.setPublishAt(
                        publishAt.isBlank() ? null : LocalDateTime.parse(publishAt)
                );
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Invalid publish date"));
            }
        }



        posts.save(post);
        return ResponseEntity.ok(service.toFeedDto(post, username));
    }


    /* ===================== IMAGE SAVE ===================== */

    private String saveImage(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new IllegalArgumentException("Empty file");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Only image files allowed");
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Image too large (max 5MB)");
            }

            String original = file.getOriginalFilename();
            String cleanName = original == null
                    ? "image"
                    : original.replaceAll("[^a-zA-Z0-9._-]", "_");

            String filename = System.currentTimeMillis() + "_" + cleanName;

            Path uploadDir = Paths.get("uploads");
            Files.createDirectories(uploadDir);

            Path filePath = uploadDir.resolve(filename);
            Files.copy(
                    file.getInputStream(),
                    filePath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            return "/uploads/" + filename;

        } catch (Exception e) {
            throw new RuntimeException("Failed to save image", e);
        }
    }

    @PatchMapping("/{id}/pin")
    public ResponseEntity<?> togglePin(
            @PathVariable Long id,
            @RequestParam String username
    ) {
        Post post = posts.findById(id).orElse(null);
        if (post == null) return ResponseEntity.notFound().build();

        // admin-only
        if (!service.isAdmin(username)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Admins only"));
        }

        // toggle
        post.setPinned(!post.isPinned());
        post.setPinnedAt(post.isPinned() ? java.time.LocalDateTime.now() : null);

        posts.save(post);
        return ResponseEntity.ok(service.toFeedDto(post, username));
    }

    @GetMapping("/references/search")
    public List<Map<String, Object>> searchReferences(
            @RequestParam String q
    ) {
        return service.searchReferences(q);
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<?> sharePost(@PathVariable Long id) {
        Post post = posts.findById(id).orElse(null);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }

        post.incrementShareCount();
        posts.save(post);

        return ResponseEntity.ok(Map.of(
                "shareCount", post.getShareCount()
        ));
    }


}
