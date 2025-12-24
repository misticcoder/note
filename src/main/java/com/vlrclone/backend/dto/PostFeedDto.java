package com.vlrclone.backend.dto;

import java.time.LocalDateTime;

public class PostFeedDto {

    public Long id;
    public String author;
    public String content;
    public String imageUrl;
    public LocalDateTime createdAt;
    public long replyCount;

    public long likes;
    public boolean myLike;

    public PostFeedDto(
            Long id,
            String author,
            String content,
            String imageUrl,
            LocalDateTime createdAt,
            long likes,
            boolean myLike,
            long replyCount
    ) {
        this.id = id;
        this.author = author;
        this.content = content;
        this.imageUrl = imageUrl;
        this.createdAt = createdAt;
        this.likes = likes;
        this.myLike = myLike;
        this.replyCount = replyCount;
    }
}
