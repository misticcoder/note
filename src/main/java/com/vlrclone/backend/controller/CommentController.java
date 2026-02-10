// src/main/java/com/vlrclone/backend/controller/CommentController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.dto.CommentResponseDto;
import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.model.User.Role;
import com.vlrclone.backend.repository.CommentRepository;
import com.vlrclone.backend.repository.ThreadRepository;
import com.vlrclone.backend.repository.UserRepository;
import com.vlrclone.backend.service.CommentService;
import com.vlrclone.backend.service.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CommentController {

    private final CommentRepository comments;
    private final ThreadRepository threads;
    private final UserRepository users;
    private final CommentService commentService;
    private final CurrentUserService currentUserService;

    public CommentController(
            CommentRepository comments,
            ThreadRepository threads,
            UserRepository users,
            CommentService commentService,
            CurrentUserService currentUserService
    ) {
        this.comments = comments;
        this.threads = threads;
        this.users = users;
        this.commentService = commentService;
        this.currentUserService = currentUserService;
    }

    /* ============================================================
       THREAD COMMENTS
    ============================================================ */

    @GetMapping("/threads/{threadId}/comments")
    public ResponseEntity<?> getThreadComments(
            @PathVariable Long threadId,
            @RequestParam(required = false) String username
    ) {
        if (!threads.existsById(threadId)) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Thread not found"));
        }

        List<Comment> list =
                comments.findByThreadIdOrderByCreatedAtAsc(threadId);

        return ResponseEntity.ok(
                commentService.getThreadComments(threadId, username)
        );
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

        return ResponseEntity.ok(
                commentService.createComment(
                        username,
                        text,
                        parentId,
                        threadId,
                        null,
                        null
                )
        );

    }

    @DeleteMapping("/threads/{threadId}/comments/{commentId}")
    public ResponseEntity<?> deleteThreadComment(
            @PathVariable Long threadId,
            @PathVariable Long commentId,
            HttpServletRequest request
    ) {
        if (!threads.existsById(threadId)) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Thread not found"));
        }
        User requester = currentUserService.requireUser(request);
        return deleteCommentInternal(commentId, requester, threadId, null);
    }

    /* ============================================================
       POST COMMENTS
    ============================================================ */
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<CommentResponseDto>> getPostComments(
            @PathVariable Long postId,
            HttpServletRequest request
    ) {
        User user = currentUserService.requireUser(request);

        return ResponseEntity.ok(
                commentService.getPostComments(postId, user.getUsername())
        );
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

        return ResponseEntity.ok(
                commentService.createComment(username, text, parentId, null, postId, null));

    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<?> deletePostComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            HttpServletRequest request
    ) {
        User requester = currentUserService.requireUser(request);
        return deleteCommentInternal(commentId, requester, null, postId);
    }


    /* ============================================================
       SHARED DELETE LOGIC
    ============================================================ */

    private ResponseEntity<?> deleteCommentInternal(
            Long commentId,
            User requester,
            Long expectedThreadId,
            Long expectedPostId
    ) {

        if (requester == null) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Requester not found"));
        }

        Comment c = comments.findById(commentId).orElse(null);
        if (c == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Comment not found"));
        }

        if (expectedThreadId != null &&
                !expectedThreadId.equals(c.getThreadId())) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Comment not found"));
        }

        if (expectedPostId != null &&
                !expectedPostId.equals(c.getPostId())) {
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

    /* ============================================================
       HELPERS
    ============================================================ */

    private Long parseParentId(Map<String, String> body) {
        if (!body.containsKey("parentId")) return null;
        try {
            return body.get("parentId") == null
                    ? null
                    : Long.valueOf(body.get("parentId"));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /* ===================== EVENTS ===================== */

    /* ============================================================
   EVENT COMMENTS
============================================================ */

    @GetMapping("/events/{eventId}/comments")
    public ResponseEntity<List<CommentResponseDto>> getEventComments(
            @PathVariable Long eventId,
            @RequestParam(required = false) String username
    ) {
        return ResponseEntity.ok(
                commentService.getEventComments(eventId, username)
        );
    }

    @PostMapping("/events/{eventId}/comments")
    public ResponseEntity<?> createEventComment(
            @PathVariable Long eventId,
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

        return ResponseEntity.ok(
                commentService.createComment(username, text, parentId, null, null, eventId));


    }


    @DeleteMapping("/events/{eventId}/comments/{commentId}")
    public ResponseEntity<?> deleteEventComment(
            @PathVariable Long eventId,
            @PathVariable Long commentId,
            HttpServletRequest request
    ) {
        User user = currentUserService.requireUser(request);
        return deleteCommentInternal(commentId, user, null, null);
    }

}
