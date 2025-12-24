// src/main/java/com/vlrclone/backend/controller/CommentController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.dto.CommentResponseDto;
import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.model.User.Role;
import com.vlrclone.backend.repository.CommentRepository;
import com.vlrclone.backend.repository.ThreadRepository;
import com.vlrclone.backend.repository.UserRepository;
import com.vlrclone.backend.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api")
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

    /* ===================== THREAD COMMENTS ===================== */

    @GetMapping("/threads/{threadId}/comments")
    public ResponseEntity<?> threadComments(
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

    @PostMapping("/threads/{threadId}/comments")
    public ResponseEntity<?> createThreadComment(
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

        Long parentId = parseParentId(body);
        if (parentId != null && !comments.existsById(parentId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Parent comment not found"));
        }

        Comment c = new Comment();
        c.setThreadId(threadId);
        c.setUsername(username);
        c.setComment(text);
        c.setParentId(parentId);

        return ResponseEntity.ok(comments.save(c));
    }

    @DeleteMapping("/threads/{threadId}/comments/{commentId}")
    public ResponseEntity<?> deleteThreadComment(
            @PathVariable Long threadId,
            @PathVariable Long commentId,
            @RequestParam String requesterEmail
    ) {
        if (!threads.existsById(threadId)) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Thread not found"));
        }

        return deleteCommentInternal(commentId, requesterEmail, threadId);
    }

    /* ===================== POST COMMENTS ===================== */

    @GetMapping("/posts/{postId}/comments")
    public List<CommentResponseDto> postComments(
            @PathVariable Long postId,
            @RequestParam(required = false) String username
    ) {
        return commentService.getPostCommentsWithReactions(postId, username);
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> createPostComment(
            @PathVariable Long postId,
            @RequestBody Map<String, String> body
    ) {
        String username = body.get("username");
        String text = body.getOrDefault("comment", "").trim();

        if (username == null || username.isBlank() || text.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "username and comment are required"));
        }

        Long parentId = parseParentId(body);
        if (parentId != null && !comments.existsById(parentId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Parent comment not found"));
        }

        Comment c = new Comment();
        c.setPostId(postId);
        c.setUsername(username);
        c.setComment(text);
        c.setParentId(parentId);

        return ResponseEntity.ok(comments.save(c));
    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<?> deletePostComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestParam String requesterEmail
    ) {
        return deleteCommentInternal(commentId, requesterEmail, null);
    }

    /* ===================== SHARED HELPERS ===================== */

    private ResponseEntity<?> deleteCommentInternal(
            Long commentId,
            String requesterEmail,
            Long expectedThreadId
    ) {
        var requester = users.findByEmail(requesterEmail).orElse(null);
        if (requester == null) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Requester not found"));
        }

        var c = comments.findById(commentId).orElse(null);
        if (c == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Comment not found"));
        }

        if (expectedThreadId != null &&
                !expectedThreadId.equals(c.getThreadId())) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Comment not found"));
        }

        boolean isAdmin = requester.getRole() == Role.ADMIN;
        boolean isOwner =
                requester.getUsername() != null &&
                        requester.getUsername().equals(c.getUsername());

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Not allowed"));
        }

        comments.deleteById(commentId);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    private Long parseParentId(Map<String, String> body) {
        if (!body.containsKey("parentId") || body.get("parentId") == null) {
            return null;
        }
        try {
            return Long.valueOf(body.get("parentId"));
        } catch (NumberFormatException e) {
            return null;
        }
    }


}
