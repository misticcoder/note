package com.vlrclone.backend.dto;

import java.util.List;

public class SearchResponseDto {

    public List<SearchResultDto> events;
    public List<SearchResultDto> clubs;
    public List<SearchResultDto> threads;
    public List<SearchResultDto> posts;
    public List<SearchResultDto> tags;

    public boolean hasMore;

    public SearchResponseDto(
            List<SearchResultDto> events,
            List<SearchResultDto> clubs,
            List<SearchResultDto> threads,
            List<SearchResultDto> posts,
            List<SearchResultDto> tags
    ) {
        this.events = events;
        this.clubs = clubs;
        this.threads = threads;
        this.posts = posts;
        this.tags = tags;

    }
    public static SearchResponseDto empty() {
        return new SearchResponseDto(
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );
    }

}

