// src/main/java/com/vlrclone/backend/controller/CommentController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.Role;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.CommentRepository;
import com.vlrclone.backend.repository.ThreadRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/threads/{threadId}/comments")
@CrossOrigin(origins = "http://localhost:3000")
public class CommentController {
    private final CommentRepository comments;
    private final ThreadRepository threads;
    private final UserRepository users;

    public CommentController(CommentRepository comments, ThreadRepository threads, UserRepository users) {
        this.comments = comments;
        this.threads = threads;
        this.users = users;
    }

    @GetMapping
    public ResponseEntity<?> list(@PathVariable Long threadId) {
        if (!threads.existsById(threadId)) {
            return ResponseEntity.status(404).body(Map.of("message","Thread not found"));
        }
        List<Comment> out = comments.findByThreadIdOrderByCreatedAtAsc(threadId);
        return ResponseEntity.ok(out);
    }

    @PostMapping
    public ResponseEntity<?> create(@PathVariable Long threadId, @RequestBody Map<String, String> body) {
        if (!threads.existsById(threadId)) return ResponseEntity.status(404).body(Map.of("message","Thread not found"));

        String username = body.get("username");
        String text = body.getOrDefault("comment", "").trim(); // your field name is "comment"
        if (username == null || username.isBlank() || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message","username and comment are required"));
        }

        Comment c = new Comment();
        c.setThreadId(threadId);
        c.setUsername(username);
        c.setComment(text); // ensure Comment has getComment/setComment
        return ResponseEntity.ok(comments.save(c));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> delete(
            @PathVariable Long threadId,
            @PathVariable Long commentId,
            @RequestParam String requesterEmail
    ) {
        if (!threads.existsById(threadId)) return ResponseEntity.status(404).body(Map.of("message","Thread not found"));

        var requester = users.findByEmail(requesterEmail).orElse(null);
        if (requester == null) return ResponseEntity.status(403).body(Map.of("message","Requester not found"));

        var c = comments.findById(commentId).orElse(null);
        if (c == null || !threadId.equals(c.getThreadId())) {
            return ResponseEntity.status(404).body(Map.of("message","Comment not found"));
        }

        boolean isAdmin = requester.getRole() == Role.ADMIN;
        boolean isOwner = requester.getUsername() != null && requester.getUsername().equals(c.getUsername());
        if (!isAdmin && !isOwner) return ResponseEntity.status(403).body(Map.of("message","Not allowed"));

        comments.deleteById(commentId);
        return ResponseEntity.ok(Map.of("status","success"));
    }
}
