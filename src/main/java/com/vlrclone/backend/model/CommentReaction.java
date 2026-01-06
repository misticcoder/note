// src/main/java/com/vlrclone/backend/model/CommentReaction.java
package com.vlrclone.backend.model;

import com.vlrclone.backend.Enums.ReactionType;
import jakarta.persistence.*;

@Entity
@Table(
        name = "comment_reactions",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"comment_id", "user_id"}
        )
)
public class CommentReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* ===================== RELATIONS ===================== */

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    private Comment comment;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /* ===================== DATA ===================== */

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReactionType reactionType;

    /* ===================== GETTERS / SETTERS ===================== */

    public Long getId() {
        return id;
    }

    public Comment getComment() {
        return comment;
    }

    public void setComment(Comment comment) {
        this.comment = comment;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ReactionType getReactionType() {
        return reactionType;
    }

    public void setReactionType(ReactionType reactionType) {
        this.reactionType = reactionType;
    }
}
