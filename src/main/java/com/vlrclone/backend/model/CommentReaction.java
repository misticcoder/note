package com.vlrclone.backend.model;

import com.vlrclone.backend.Enums.ReactionType;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "comment_reactions",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"comment_id", "username"})
        }
)
public class CommentReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @Column(nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReactionType reactionType;

    @Column(nullable = false)
    private LocalDateTime reactedAt = LocalDateTime.now();

    // ===== Getters & Setters =====

    public Long getId() {
        return id;
    }

    public Comment getComment() {
        return comment;
    }

    public void setComment(Comment comment) {
        this.comment = comment;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public ReactionType getReactionType() {
        return reactionType;
    }

    public void setReactionType(ReactionType reactionType) {
        this.reactionType = reactionType;
    }

    public LocalDateTime getReactedAt() {
        return reactedAt;
    }
}
