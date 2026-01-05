package com.vlrclone.backend.service;

import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.dto.CommentResponseDto;
import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.CommentReaction;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.CommentReactionRepository;
import com.vlrclone.backend.repository.CommentRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class CommentService {

    private final CommentRepository comments;
    private final CommentReactionRepository reactions;

    public CommentService(
            CommentRepository comments,
            CommentReactionRepository reactions
    ) {
        this.comments = comments;
        this.reactions = reactions;
    }

    public List<CommentResponseDto> mapWithReactions(
            List<Comment> list,
            String username
    ) {
        return list.stream()
                .map(c -> CommentResponseDto.from(c, username))
                .toList();
    }

    @Transactional
    public void toggleReaction(
            Long commentId,
            User user,
            ReactionType type
    ) {
        Comment comment = comments.findById(commentId)
                .orElseThrow();

        reactions.findByComment_IdAndUser(commentId, user)
                .ifPresentOrElse(existing -> {
                    if (Objects.equals(existing.getReactionType(), type)) {
                        reactions.delete(existing);
                    } else {
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
}
