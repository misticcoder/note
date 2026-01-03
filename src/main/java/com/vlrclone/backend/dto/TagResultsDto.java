package com.vlrclone.backend.dto;

import java.util.List;

public class TagResultsDto {

    public List<SearchResultDto> events;
    public List<SearchResultDto> threads;
    public List<SearchResultDto> posts;

    public TagResultsDto(
            List<SearchResultDto> events,
            List<SearchResultDto> threads,
            List<SearchResultDto> posts
    ) {
        this.events = events;
        this.threads = threads;
        this.posts = posts;
    }
}

