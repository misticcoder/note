package com.vlrclone.backend.dto;

import com.vlrclone.backend.Enums.EventCategory;
import com.vlrclone.backend.Enums.EventVisibility;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Tag;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.Enums.Status;


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

    // ADD this constructor (do not remove your existing one if other endpoints use it)
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
                    this.tags.add(tag.getName());
                }
            }
        }

        this.visibility = e.getVisibility();
        this.category = e.getCategory();
        this.externalUrl = e.getExternalUrl();

        if (e.getAuthor() != null) {
            this.author = new AuthorDto(e.getAuthor());
        }
    }

    public EventUpdateDto(
            Long id,
            String title,
            String content,
            String location,
            LocalDateTime startAt,
            LocalDateTime endAt,
            double averageRating,
            int ratingCount,
            Long clubId,
            String clubName,
            EventVisibility visibility,
            EventCategory category,
            String externalUrl,
            Long authorId,
            String authorName,
            String authorEmail
    ) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.location = location;
        this.startAt = startAt;
        this.endAt = endAt;

        // Compute status manually (since it's @Transient in entity)
        this.status = computeStatus(startAt, endAt);

        this.averageRating = averageRating;
        this.ratingCount = ratingCount;

        this.clubId = clubId;
        this.clubName = clubName;

        this.visibility = visibility;
        this.category = category;
        this.externalUrl = externalUrl;

        if (authorId != null) {
            this.author = new AuthorDtoStub(authorId, authorName, authorEmail);
        }
    }

    private String computeStatus(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt == null) return "UPCOMING";

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime effectiveEnd =
                endAt != null ? endAt : startAt.plusHours(2);

        if (now.isBefore(startAt)) return "UPCOMING";
        if (now.isAfter(effectiveEnd)) return "ENDED";
        return "LIVE";
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

    public static class AuthorDtoStub extends AuthorDto {
        public AuthorDtoStub(Long id, String name, String email) {
            super(null);
            this.id = id;
            this.name = name;
            this.email = email;
        }
    }

}
