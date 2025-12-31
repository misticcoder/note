package com.vlrclone.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
public class Event {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private String title;
    @Column(nullable=false) private String content;
    @Column private String location;
    @Column private LocalDateTime startAt;
    @Column private LocalDateTime endAt;

    public enum EventStatus {
        UPCOMING,
        LIVE,
        ENDED
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public LocalDateTime getStartAt() { return startAt; }
    public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "event_tags",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    public Set<Tag> getTags() { return tags; }
    public void setTags(Set<Tag> tags) { this.tags = tags; }


    @Transient
    public EventStatus getStatus() {
        if (startAt == null) return EventStatus.UPCOMING;

        LocalDateTime now = LocalDateTime.now();

        LocalDateTime effectiveEnd = endAt != null
                ? endAt
                : startAt.plusHours(2); // fallback duration

        if (!now.isBefore(startAt) && now.isBefore(effectiveEnd)) {
            return EventStatus.LIVE;
        }

        if (now.isAfter(effectiveEnd)) {
            return EventStatus.ENDED;
        }

        return EventStatus.UPCOMING;
    }

}
