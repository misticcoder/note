// src/main/java/com/vlrclone/backend/controller/CommentReactionController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.CommentReaction;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.CommentReactionRepository;
import com.vlrclone.backend.repository.CommentRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentReactionController {

    private final CommentRepository commentRepo;
    private final CommentReactionRepository reactionRepo;
    private final UserRepository userRepo;

    public CommentReactionController(
            CommentRepository commentRepo,
            CommentReactionRepository reactionRepo,
            UserRepository userRepo
    ) {
        this.commentRepo = commentRepo;
        this.reactionRepo = reactionRepo;
        this.userRepo = userRepo;
    }

    /* ============================================================
       ADD / TOGGLE REACTION
    ============================================================ */

    @PostMapping("/{commentId}/reactions")
    public ResponseEntity<?> react(
            @PathVariable Long commentId,
            @RequestBody CommentReaction commentReaction,
            @RequestBody Map<String, String> body
    ) {
        String username = body.get("username");
        ReactionType type = commentReaction.getReactionType();

        if (username == null || type == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "username and reactionType required"));
        }

        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "User not found"));
        }

        Comment comment = commentRepo.findById(commentId).orElse(null);
        if (comment == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Comment not found"));
        }

        var existing =
                reactionRepo.findByComment_IdAndUser(commentId, user);

        // Same reaction → remove (toggle off)
        if (existing.isPresent() &&
                existing.get().getReactionType().equals(type)) {

            reactionRepo.delete(existing.get());
            return ResponseEntity.ok(Map.of("status", "removed"));
        }

        // Different reaction → replace
        reactionRepo.deleteByComment_IdAndUser(commentId, user);

        CommentReaction r = new CommentReaction();
        r.setComment(comment);
        r.setUser(user);
        r.setReactionType(type);

        reactionRepo.save(r);
        return ResponseEntity.ok(Map.of("status", "added"));
    }

    /* ============================================================
       REMOVE REACTION
    ============================================================ */

    @DeleteMapping("/{commentId}/reactions")
    public ResponseEntity<?> removeReaction(
            @PathVariable Long commentId,
            @RequestParam String username
    ) {
        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "User not found"));
        }

        reactionRepo.deleteByComment_IdAndUser(commentId, user);
        return ResponseEntity.ok(Map.of("status", "removed"));
    }
}
