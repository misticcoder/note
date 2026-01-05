package com.vlrclone.backend.dto;

import com.vlrclone.backend.model.Comment;

import java.time.LocalDateTime;

public class CommentDto {

    public Long id;
    public String username;
    public String comment;
    public LocalDateTime createdAt;
    public Long parentId;

    public int reactionCount;

    /* Factory method */
    public static CommentDto from(Comment c) {
        CommentDto dto = new CommentDto();
        dto.id = c.getId();
        dto.username = c.getUsername();
        dto.comment = c.getComment();
        dto.createdAt = c.getCreatedAt();
        dto.parentId = c.getParentId();
        dto.reactionCount = c.getReactions() == null ? 0 : c.getReactions().size();
        return dto;
    }
}
