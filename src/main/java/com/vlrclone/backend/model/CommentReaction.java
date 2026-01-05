package com.vlrclone.backend.model;

import com.vlrclone.backend.Enums.ReactionType;
import jakarta.persistence.*;

@Entity
@Table(name = "comment_reactions")
public class CommentReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Comment comment;

    @ManyToOne(optional = false)
    private User user;

    @Column(nullable = false)
    private ReactionType reactionType;

    /* getters / setters */

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
