package com.vlrclone.backend.controller;

import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.model.CommentReaction;
import com.vlrclone.backend.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentReactionController {

    private final CommentService service;

    public CommentReactionController(CommentService service) {
        this.service = service;
    }

    @PostMapping("/{commentId}/reactions")
    public ResponseEntity<?> react(
            @PathVariable Long commentId,
            @RequestParam String username,
            @RequestBody Map<String, String> body
    ) {
        var type = ReactionType.valueOf(
                body.get("reactionType")
        );

        service.toggleReaction(commentId, username, type);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{commentId}/reactions")
    public ResponseEntity<?> remove(
            @PathVariable Long commentId,
            @RequestParam String username
    ) {
        service.toggleReaction(commentId, username, null);
        return ResponseEntity.ok().build();
    }
}
