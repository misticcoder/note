package com.vlrclone.backend.dto;

import com.vlrclone.backend.Enums.EventCategory;
import com.vlrclone.backend.Enums.EventVisibility;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Tag;
import com.vlrclone.backend.model.User;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

public class EventUpdateDto {

    public Long id;
    public String title;
    public String content;
    public String location;
    public LocalDateTime startAt;
    public LocalDateTime endAt;

    public String status;

    public double averageRating;
    public int ratingCount;
    public Integer myRating;

    public Long clubId;
    public String clubName;

    public Set<String> tags = new HashSet<>();

    public EventVisibility visibility;
    public AuthorDto author;

    public EventCategory category;
    public String externalUrl;

    public EventUpdateDto() {}

    public EventUpdateDto(Event e) {
        this.id = e.getId();
        this.title = e.getTitle();
        this.content = e.getContent();
        this.location = e.getLocation();
        this.startAt = e.getStartAt();
        this.endAt = e.getEndAt();
        this.status = e.getStatus() != null ? e.getStatus().name() : null;

        this.averageRating = e.getAverageRating();
        this.ratingCount = e.getRatingCount();

        if (e.getClub() != null) {
            this.clubId = e.getClub().getId();
            this.clubName = e.getClub().getName();
        }

        if (e.getTags() != null) {
            for (Tag tag : e.getTags()) {
                if (tag != null && tag.getName() != null) {
                    tags.add(tag.getName());
                }
            }
        }

        this.visibility = e.getVisibility();

        if (e.getAuthor() != null) {
            this.author = new AuthorDto(e.getAuthor());
        }

        this.category = e.getCategory();
        this.externalUrl = e.getExternalUrl();
    }

    public static class AuthorDto {
        public Long id;
        public String name;
        public String email;

        public AuthorDto(User user) {
            this.id = user.getId();
            this.name = user.getUsername();
            this.email = user.getEmail();
        }
    }
}
