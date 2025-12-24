package com.vlrclone.backend.controller;

import com.vlrclone.backend.dto.ReactionRequest;
import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.dto.ReactionSummaryDto;
import com.vlrclone.backend.service.CommentReactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
public class CommentReactionController {

    private final CommentReactionService reactionService;

    public CommentReactionController(CommentReactionService reactionService) {
        this.reactionService = reactionService;
    }

    /**
     * React or change reaction
     */
    @PostMapping("/{commentId}/reactions")
    public ResponseEntity<Void> react(
            @PathVariable Long commentId,
            @RequestParam(required = false) String username,
            @RequestBody(required = false) ReactionRequest request
    ) {
        reactionService.react(commentId, username, request.getReactionType());
        return ResponseEntity.ok().build();
    }

    /**
     * Remove reaction
     */
    @DeleteMapping("/{commentId}/reactions")
    public ResponseEntity<Void> removeReaction(
            @PathVariable Long commentId,
            @RequestParam String username
    ) {
        reactionService.removeReaction(commentId, username);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{commentId}/reactions")
    public ResponseEntity<ReactionSummaryDto> getReactions(
            @PathVariable Long commentId,
            @RequestParam String username
    ) {
        return ResponseEntity.ok(
                reactionService.getReactionSummary(commentId, username)
        );
    }
}
