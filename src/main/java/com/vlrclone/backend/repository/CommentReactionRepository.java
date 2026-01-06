package com.vlrclone.backend.repository;

import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.model.CommentReaction;
import com.vlrclone.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommentReactionRepository
        extends JpaRepository<CommentReaction, Long> {

    Optional<CommentReaction>
    findByCommentIdAndUser(Long commentId, User user);

    List<CommentReaction>
    findByCommentId(Long commentId);

    long countByCommentIdAndReactionType(
            Long commentId,
            ReactionType type
    );

    void deleteByCommentIdAndUser(Long commentId, User user);

    Optional<CommentReaction> findByCommentIdAndUserId(
            Long commentId,
            Long userId
    );

    void deleteByCommentIdAndUserId(
            Long commentId,
            Long userId
    );


}
