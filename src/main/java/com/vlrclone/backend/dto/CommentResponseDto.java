package com.vlrclone.backend.dto;

import com.vlrclone.backend.Enums.ReactionType;

import java.time.LocalDateTime;
import java.util.Map;

public class CommentResponseDto {

    private Long id;
    private String username;
    private String comment;
    private LocalDateTime createdAt;
    private ReactionSummaryDto reactions;
    private Long parentId;

    public CommentResponseDto(
            Long id,
            String username,
            String comment,
            LocalDateTime createdAt,
            ReactionSummaryDto reactions,
            Long parentId
    ) {
        this.id = id;
        this.username = username;
        this.comment = comment;
        this.createdAt = createdAt;
        this.reactions = reactions;
        this.parentId = parentId;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getComment() {
        return comment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public ReactionSummaryDto getReactions() {
        return reactions;
    }
    public Long getParentId() {
        return parentId;
    }
}
