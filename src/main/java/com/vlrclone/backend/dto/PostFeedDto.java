package com.vlrclone.backend.dto;

import com.vlrclone.backend.Enums.ReferenceType;
import java.time.LocalDateTime;
import java.util.List;

public class PostFeedDto {

    public Long id;
    public String author;
    public String content;

    public List<ImageDto> images;
    public List<ReferenceDto> references;

    public LocalDateTime createdAt;
    public LocalDateTime publishAt;   // ✅ ADD
    public long likes;
    public boolean myLike;
    public long replyCount;
    public boolean pinned;
    public int shareCount;

    public PostFeedDto(
            Long id,
            String author,
            String content,
            List<ImageDto> images,
            List<ReferenceDto> references,
            LocalDateTime createdAt,
            LocalDateTime publishAt,   // ✅ ADD
            long likes,
            boolean myLike,
            long replyCount,
            boolean pinned,
            int shareCount
    ) {
        this.id = id;
        this.author = author;
        this.content = content;
        this.images = images;
        this.references = references;
        this.createdAt = createdAt;
        this.publishAt = publishAt;   // ✅ ADD
        this.likes = likes;
        this.myLike = myLike;
        this.replyCount = replyCount;
        this.pinned = pinned;
        this.shareCount = shareCount;
    }

    /* ===================== INNER DTOs ===================== */

    public static class ImageDto {
        public Long id;
        public String url;

        public ImageDto(Long id, String url) {
            this.id = id;
            this.url = url;
        }
    }

    public static class ReferenceDto {
        public ReferenceType type;
        public Long targetId;
        public String displayText;

        public ReferenceDto(
                ReferenceType type,
                Long targetId,
                String displayText
        ) {
            this.type = type;
            this.targetId = targetId;
            this.displayText = displayText;
        }
    }
}
