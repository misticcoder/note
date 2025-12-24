package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.CommentReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommentReactionRepository
        extends JpaRepository<CommentReaction, Long> {

    Optional<CommentReaction> findByCommentIdAndUsername(
            Long commentId,
            String username
    );

    List<CommentReaction> findByCommentId(Long commentId);

    long countByCommentIdAndReactionType(
            Long commentId,
            com.vlrclone.backend.Enums.ReactionType reactionType
    );
}
