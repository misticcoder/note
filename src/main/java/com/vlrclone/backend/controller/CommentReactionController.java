// src/main/java/com/vlrclone/backend/controller/CommentReactionController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.UserRepository;
import com.vlrclone.backend.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentReactionController {

    private final CommentService commentService;
    private final UserRepository users;

    public CommentReactionController(
            CommentService commentService,
            UserRepository users
    ) {
        this.commentService = commentService;
        this.users = users;
    }

    @PostMapping("/{commentId}/reactions")
    public ResponseEntity<?> toggleReaction(
            @PathVariable Long commentId,
            @RequestParam String requesterEmail,
            @RequestBody Map<String, String> body
    ) {
        User user = users.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ReactionType type = ReactionType.valueOf(body.get("type"));

        commentService.toggleReaction(commentId, user, type);

        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
