package com.vlrclone.backend.service;

import com.vlrclone.backend.dto.CommentResponseDto;
import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.repository.CommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentReactionService reactionService;

    public CommentService(
            CommentRepository commentRepository,
            CommentReactionService reactionService
    ) {
        this.commentRepository = commentRepository;
        this.reactionService = reactionService;
    }

    @Transactional(readOnly = true)
    public List<CommentResponseDto> getCommentsWithReactions(
            Long threadId,
            String username
    ) {
        return commentRepository.findByThreadIdOrderByCreatedAtAsc(threadId)
                .stream()
                .map(c -> new CommentResponseDto(
                        c.getId(),
                        c.getUsername(),
                        c.getComment(),
                        c.getCreatedAt(),
                        reactionService.getReactionSummary(c.getId(), username),
                        c.getParentId()
                ))
                .toList();
    }
}
