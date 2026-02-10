package com.vlrclone.backend.dto;

import com.vlrclone.backend.Enums.NotificationType;
import com.vlrclone.backend.model.Notification;

import java.time.LocalDateTime;

public class NotificationDto {

    private Long id;
    private String message;
    private NotificationType type;
    private boolean isRead;
    private LocalDateTime createdAt;

    private Long relatedEventId;
    private Long relatedClubId;
    private Long relatedCommentId;
    private Long relatedThreadId;
    private Long relatedPostId;

    /* =====================
       Factory
       ===================== */

    public static NotificationDto from(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.id = n.getId();
        dto.type = n.getType();
        dto.message = n.getMessage();
        dto.createdAt = n.getCreatedAt();
        dto.isRead = n.isRead();
        dto.relatedEventId = n.getRelatedEventId();
        dto.relatedClubId = n.getRelatedClubId();
        dto.relatedCommentId = n.getRelatedCommentId();
        dto.relatedThreadId = n.getRelatedThreadId();
        dto.relatedPostId = n.getRelatedPostId();
        return dto;
    }


    /* =====================
       Getters
       ===================== */

    public Long getId() {
        return id;
    }

    public String getMessage() {
        return message;
    }

    public NotificationType getType() {
        return type;
    }

    public boolean isRead() {
        return isRead;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getRelatedEventId() {
        return relatedEventId;
    }

    public Long getRelatedClubId() {
        return relatedClubId;
    }

    public Long getRelatedCommentId() {
        return relatedCommentId;
    }

    public Long getRelatedThreadId() {
        return relatedThreadId;
    }

    public Long getRelatedPostId() {
        return relatedPostId;
    }
}