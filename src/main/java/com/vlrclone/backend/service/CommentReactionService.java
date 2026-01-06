package com.vlrclone.backend.service;

import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.dto.ReactionSummaryDto;
import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.CommentReaction;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.CommentReactionRepository;
import com.vlrclone.backend.repository.CommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CommentReactionService {

    private final CommentReactionRepository reactionRepository;
    private final CommentRepository commentRepository;

    public CommentReactionService(
            CommentReactionRepository reactionRepository,
            CommentRepository commentRepository
    ) {
        this.reactionRepository = reactionRepository;
        this.commentRepository = commentRepository;
    }

    /**
     * React or change reaction
     */
    @Transactional
    public void react(Long commentId, User username, ReactionType reactionType) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        Optional<CommentReaction> existing =
                reactionRepository.findByCommentIdAndUser(commentId, username );

        if (existing.isPresent()) {
            // change reaction
            CommentReaction reaction = existing.get();
            reaction.setReactionType(reactionType);
        } else {
            // new reaction
            CommentReaction reaction = new CommentReaction();
            reaction.setComment(comment);
            reaction.setUser(username);
            reaction.setReactionType(reactionType);
            reactionRepository.save(reaction);
        }
    }

    /**
     * Remove reaction
     */
    @Transactional
    public void removeReaction(Long commentId, User username) {
        reactionRepository.findByCommentIdAndUser(commentId, username)
                .ifPresent(reactionRepository::delete);
    }

    @Transactional(readOnly = true)
    public ReactionSummaryDto getReactionSummary(
            Long commentId,
            String username
    ) {
        var reactions = reactionRepository.findByCommentId(commentId);

        var counts = reactions.stream()
                .collect(Collectors.groupingBy(
                        CommentReaction::getReactionType,
                        Collectors.counting()
                ));

        ReactionType myReaction = username == null
                ? null
                : reactions.stream()
                .filter(r -> username.equals(r.getUser().getUsername()))
                .map(CommentReaction::getReactionType)
                .findFirst()
                .orElse(null);

        return new ReactionSummaryDto(counts, myReaction);
    }
}
