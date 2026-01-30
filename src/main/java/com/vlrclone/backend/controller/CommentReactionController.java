// src/main/java/com/vlrclone/backend/controller/CommentReactionController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.UserRepository;
import com.vlrclone.backend.service.CommentService;
import com.vlrclone.backend.service.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentReactionController {

    private final CommentService commentService;
    private final CurrentUserService currentUser;

    public CommentReactionController(
            CommentService commentService,
            CurrentUserService currentUser
    ) {
        this.commentService = commentService;
        this.currentUser = currentUser;
    }

    @PostMapping("/{commentId}/reactions")
    public ResponseEntity<?> toggleReaction(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> body,
            HttpServletRequest request
    ) {
        User user = currentUser.requireUser(request);

        String rawType = body.get("type");
        if (rawType == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Reaction type is required"));
        }

        ReactionType type;
        try {
            type = ReactionType.valueOf(rawType);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid reaction type"));
        }

        commentService.toggleReaction(commentId, user, type);

        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
