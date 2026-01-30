package com.vlrclone.backend.service;

import com.vlrclone.backend.Enums.NotificationType;
import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.dto.CommentResponseDto;
import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.CommentReaction;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.CommentReactionRepository;
import com.vlrclone.backend.repository.CommentRepository;
import com.vlrclone.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommentService {

    private final CommentRepository comments;
    private final CommentReactionRepository reactions;
    private final UserRepository users;
    private final NotificationService notificationService;

    public CommentService(
            CommentRepository comments,
            CommentReactionRepository reactions,
            UserRepository users,
            NotificationService notificationService
    ) {
        this.comments = comments;
        this.reactions = reactions;
        this.users = users;
        this.notificationService = notificationService;
    }

    /* ============================================================
       REACTION ACTIONS
    ============================================================ */

    @Transactional
    public void react(
            Long commentId,
            String requesterEmail,
            String reactionType
    ) {
        User user = users.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        ReactionType type = ReactionType.valueOf(reactionType);

        Comment comment = comments.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        reactions.findByCommentIdAndUserId(commentId, user.getId())
                .ifPresentOrElse(existing -> {
                    if (existing.getReactionType() == type) {
                        // toggle off
                        reactions.delete(existing);
                    } else {
                        // switch reaction
                        existing.setReactionType(type);
                    }
                }, () -> {
                    CommentReaction r = new CommentReaction();
                    r.setComment(comment);
                    r.setUser(user);
                    r.setReactionType(type);
                    reactions.save(r);
                });
    }

    @Transactional
    public void removeReaction(
            Long commentId,
            String requesterEmail
    ) {
        User user = users.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        reactions.deleteByCommentIdAndUserId(commentId, user.getId());
    }

    /* ============================================================
       READ (POST / THREAD / EVENT)
    ============================================================ */

    public List<CommentResponseDto> getPostComments(
            Long postId,
            String viewerUsername
    ) {
        User viewer = resolveViewer(viewerUsername);

        return comments.findByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .map(c -> map(c, viewer))
                .toList();
    }


    public List<CommentResponseDto> getThreadComments(
            Long threadId,
            String viewerUsername
    ) {
        User viewer = resolveViewer(viewerUsername);

        return comments.findByThreadIdOrderByCreatedAtAsc(threadId)
                .stream()
                .map(c -> map(c, viewer))
                .toList();
    }


    public List<CommentResponseDto> getEventComments(
            Long eventId,
            String viewerUsername
    ) {
        User viewer = resolveViewer(viewerUsername);

        return comments.findByEventIdOrderByCreatedAtAsc(eventId)
                .stream()
                .map(c -> map(c, viewer))
                .toList();
    }


    /* ============================================================
       CORE DTO MAPPER
    ============================================================ */

    private CommentResponseDto map(Comment c, User viewer) {
        CommentResponseDto dto = new CommentResponseDto();

        dto.id = c.getId();
        dto.username = c.getUsername();
        dto.comment = c.getComment();
        dto.createdAt = c.getCreatedAt();
        dto.parentId = c.getParentId();

        // ---- Reaction counts ----
        Map<String, Long> counts = new HashMap<>();
        for (CommentReaction r : c.getReactions()) {
            String key = r.getReactionType().name();
            counts.put(key, counts.getOrDefault(key, 0L) + 1);
        }
        dto.reactionCounts = counts;

        // ---- My reaction ----
        if (viewer != null) {
            reactions.findByCommentIdAndUserId(c.getId(), viewer.getId())
                    .ifPresent(r ->
                            dto.myReaction = r.getReactionType()
                    );
        }

        return dto;
    }

    /* ============================================================
       HELPERS
    ============================================================ */

    private User resolveViewer(String username) {
        if (username == null || username.isBlank()) return null;
        return users.findByUsername(username).orElse(null);
    }



    @Transactional
    public void toggleReaction(Long commentId, User user, ReactionType type) {
        Comment comment = comments.findById(commentId)
                .orElseThrow();

        reactions.findByCommentIdAndUser(commentId, user)
                .ifPresentOrElse(existing -> {
                    if (existing.getReactionType() == type) {
                        reactions.delete(existing);
                    } else {
                        existing.setReactionType(type);
                        reactions.save(existing);
                    }
                }, () -> {
                    CommentReaction r = new CommentReaction();
                    r.setComment(comment);
                    r.setUser(user);
                    r.setReactionType(type);
                    reactions.save(r);
                });
    }

    @Transactional
    public Comment createComment(
            String username,
            String text,
            Long parentId,
            Long threadId,
            Long postId,
            Long eventId
    ) {
        Comment comment = new Comment();
        comment.setUsername(username);
        comment.setComment(text);
        comment.setParentId(parentId);
        comment.setThreadId(threadId);
        comment.setPostId(postId);
        comment.setEventId(eventId);

        Comment saved = comments.save(comment);

        if (parentId != null) {
            comments.findById(parentId).ifPresent(parent -> {

                if (!parent.getUsername().equals(username)) {

                    users.findByUsername(parent.getUsername()).ifPresent(parentUser -> {

                        String message = "@" + username + " replied to your comment";

                        notificationService.notifyUser(
                                parentUser,
                                NotificationType.COMMENT_REPLY,
                                message,
                                eventId,          // event context
                                null,             // no club
                                saved.getId()     // 🔗 LINK TO REPLY COMMENT
                        );
                    });
                }
            });
        }


        return saved;
    }


}
