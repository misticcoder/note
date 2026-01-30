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
            HttpServletRequest request,
            @RequestBody Map<String, String> body
    ) {
        User user = currentUser.requireUser(request);

        ReactionType type = ReactionType.valueOf(body.get("type"));

        commentService.toggleReaction(commentId, user, type);

        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
