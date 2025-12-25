package com.vlrclone.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PostFeedDto {

    public Long id;
    public String author;
    public String content;
    public List<String> images;
    public LocalDateTime createdAt;
    public long replyCount;

    public long likes;
    public boolean myLike;

    public PostFeedDto(
            Long id,
            String author,
            String content,
            List<String> images,
            LocalDateTime createdAt,
            long likes,
            boolean myLike,
            long replyCount
    ) {
        this.id = id;
        this.author = author;
        this.content = content;
        this.images = images;
        this.createdAt = createdAt;
        this.likes = likes;
        this.myLike = myLike;
        this.replyCount = replyCount;
    }
}
