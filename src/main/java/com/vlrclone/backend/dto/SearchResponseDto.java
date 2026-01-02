package com.vlrclone.backend.dto;

import java.util.List;

public class SearchResponseDto {

    public List<SearchResultDto> events;
    public List<SearchResultDto> clubs;
    public List<SearchResultDto> threads;
    public List<SearchResultDto> posts;

    public SearchResponseDto(
            List<SearchResultDto> events,
            List<SearchResultDto> clubs,
            List<SearchResultDto> threads,
            List<SearchResultDto> posts
    ) {
        this.events = events;
        this.clubs = clubs;
        this.threads = threads;
        this.posts = posts;
    }
}
