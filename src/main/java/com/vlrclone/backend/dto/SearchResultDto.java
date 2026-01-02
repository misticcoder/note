package com.vlrclone.backend.dto;

public class SearchResultDto {

    public Long id;
    public String title;
    public String subtitle;
    public String status;
    public String url;

    public SearchResultDto(
            Long id,
            String title,
            String subtitle,
            String status,
            String url
    ) {
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.status = status;
        this.url = url;
    }
}

