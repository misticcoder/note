package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.CommentReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommentReactionRepository
        extends JpaRepository<CommentReaction, Long> {

    Optional<CommentReaction>
    findByComment_IdAndUsername(Long commentId, String username);

    List<CommentReaction>
    findByComment_Id(Long commentId);

    void deleteByComment_IdAndUsername(Long commentId, String username);
}
