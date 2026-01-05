package com.vlrclone.backend.dto;

import com.vlrclone.backend.Enums.ReactionType;
import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.CommentReaction;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class CommentResponseDto {

    public Long id;
    public String username;
    public String comment;
    public LocalDateTime createdAt;
    public Long parentId;

    public Map<String, Long> reactionCounts = new HashMap<>();
    public ReactionType myReaction;

    public static CommentResponseDto from(
            Comment c,
            String currentUsername
    ) {
        CommentResponseDto dto = new CommentResponseDto();
        dto.id = c.getId();
        dto.username = c.getUsername();
        dto.comment = c.getComment();
        dto.createdAt = c.getCreatedAt();
        dto.parentId = c.getParentId();

        for (CommentReaction r : c.getReactions()) {
            dto.reactionCounts.merge(
                    r.getReactionType().name(),
                    1L,
                    Long::sum
            );

            if (currentUsername != null &&
                    currentUsername.equals(r.getUser().getUsername())) {
                dto.myReaction = r.getReactionType();
            }
        }

        return dto;
    }
}
