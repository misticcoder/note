package com.vlrclone.backend.controller;

import com.vlrclone.backend.dto.PostFeedDto;
import com.vlrclone.backend.model.Post;
import com.vlrclone.backend.model.PostImage;
import com.vlrclone.backend.service.PostService;
import com.vlrclone.backend.repository.PostRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "http://localhost:3000")
public class PostController {

    private final PostRepository posts;
    private final PostService service;

    public PostController(PostRepository posts, PostService service) {
        this.posts = posts;
        this.service = service;
    }

    @GetMapping
    public List<PostFeedDto> feed(
            @RequestParam(required = false) String username
    ) {
        return service.getFeed(username);
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> create(
            @RequestParam String author,
            @RequestParam String content,
            @RequestParam(required = false) List<MultipartFile> images
    ) {
        boolean hasText = content != null && !content.isBlank();
        boolean hasImage = images != null && !images.isEmpty();

        if (author == null || author.isBlank() || (!hasText && !hasImage)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Post must contain text or image"));
        }


        Post post = new Post();
        post.setAuthor(author);
        post.setContent(content);

        if (images != null) {
            int position = 0;

            for (MultipartFile file : images) {
                if (file.isEmpty()) continue;

                String url = saveImage(file);

                PostImage img = new PostImage();
                img.setUrl(url);
                img.setPosition(position++);
                img.setPost(post);

                post.getImages().add(img);
            }
        }

        return ResponseEntity.ok(posts.save(post));
    }




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
}
