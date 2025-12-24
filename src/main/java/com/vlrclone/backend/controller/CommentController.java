// src/main/java/com/vlrclone/backend/controller/CommentController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.dto.CommentResponseDto;
import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.User.Role;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.CommentRepository;
import com.vlrclone.backend.repository.ThreadRepository;
import com.vlrclone.backend.repository.UserRepository;
import com.vlrclone.backend.service.CommentService;
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
    private final CommentService commentService;

    public CommentController(
            CommentRepository comments,
            ThreadRepository threads,
            UserRepository users,
            CommentService commentService
    ) {
        this.comments = comments;
        this.threads = threads;
        this.users = users;
        this.commentService = commentService;
    }


    @GetMapping
    public ResponseEntity<?> list(
            @PathVariable Long threadId,
            @RequestParam(required = false) String username
    ) {
        if (!threads.existsById(threadId)) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Thread not found"));
        }

        List<CommentResponseDto> out =
                commentService.getCommentsWithReactions(threadId, username);

        return ResponseEntity.ok(out);
    }



    @PostMapping
    public ResponseEntity<?> create(
            @PathVariable Long threadId,
            @RequestBody Map<String, String> body
    ) {
        if (!threads.existsById(threadId)) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Thread not found"));
        }

        String username = body.get("username");
        String text = body.getOrDefault("comment", "").trim();

        if (username == null || username.isBlank() || text.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "username and comment are required"));
        }

        Long parentId = null;
        if (body.containsKey("parentId") && body.get("parentId") != null) {
            try {
                parentId = Long.valueOf(body.get("parentId"));

                if (!comments.existsById(parentId)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Parent comment not found"));
                }
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Invalid parentId"));
            }
        }

        Comment c = new Comment();
        c.setThreadId(threadId);
        c.setUsername(username);
        c.setComment(text);
        c.setParentId(parentId); // ← this is the key line

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
