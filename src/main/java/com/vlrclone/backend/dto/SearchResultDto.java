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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}

