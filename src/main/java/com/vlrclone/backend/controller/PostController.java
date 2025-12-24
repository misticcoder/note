package com.vlrclone.backend.controller;

import com.vlrclone.backend.dto.PostFeedDto;
import com.vlrclone.backend.model.Post;
import com.vlrclone.backend.service.PostService;
import com.vlrclone.backend.repository.PostRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        String author = body.get("author");
        String content = body.get("content");

        if (author == null || content == null || content.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "author and content required"));
        }

        Post p = new Post();
        p.setAuthor(author);
        p.setContent(content);
        p.setImageUrl(body.get("imageUrl"));

        return ResponseEntity.ok(posts.save(p));
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
}
