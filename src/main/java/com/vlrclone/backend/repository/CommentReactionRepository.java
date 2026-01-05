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
    findByComment_IdAndUser(Long commentId, User user);

    List<CommentReaction>
    findByComment_Id(Long commentId);

    long countByCommentIdAndReactionType(
            Long commentId,
            ReactionType type
    );

    void deleteByComment_IdAndUser(Long commentId, User user);
}
