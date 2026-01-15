// src/main/java/com/vlrclone/backend/dto/EventUpdateDto.java
package com.vlrclone.backend.dto;

import com.vlrclone.backend.Enums.EventVisibility;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Tag;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

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

    public Set<String> tags;

    public EventVisibility visibility;

    public EventUpdateDto() {
    }

    public EventUpdateDto(Event e) {
        this.id = e.getId();
        this.title = e.getTitle();
        this.content = e.getContent();
        this.location = e.getLocation();
        this.startAt = e.getStartAt();
        this.endAt = e.getEndAt();
        this.status = e.getStatus().name();

        this.averageRating = e.getAverageRating();
        this.ratingCount = e.getRatingCount();

        if (e.getClub() != null) {
            this.clubId = e.getClub().getId();
            this.clubName = e.getClub().getName();
        }

        this.tags = e.getTags()
                .stream()
                .map(Tag::getName)
                .collect(Collectors.toSet());

        this.visibility = e.getVisibility();
    }

}
