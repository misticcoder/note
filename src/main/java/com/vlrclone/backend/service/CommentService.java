package com.vlrclone.backend.service;

import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.dto.CommentResponseDto;
import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.CommentReaction;
import com.vlrclone.backend.repository.CommentReactionRepository;
import com.vlrclone.backend.repository.CommentRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

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
            String username,
            ReactionType type
    ) {
        Comment comment = comments.findById(commentId)
                .orElseThrow();

        reactions.findByComment_IdAndUsername(commentId, username)
                .ifPresentOrElse(existing -> {
                    if (existing.getType() == type) {
                        reactions.delete(existing);
                    } else {
                        existing.setType(type);
                    }
                }, () -> {
                    CommentReaction r = new CommentReaction();
                    r.setComment(comment);
                    r.setUsername(username);
                    r.setType(type);
                    reactions.save(r);
                });
    }
}
