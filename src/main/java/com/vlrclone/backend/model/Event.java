package com.vlrclone.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "event")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String content;

    @Column
    private String location;

    @Column
    private LocalDateTime startAt;

    @Column
    private LocalDateTime endAt;

    /* =====================
       RELATIONSHIPS
    ===================== */

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")

    private Club club;

    @JsonManagedReference
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<EventAttendance> attendance = new HashSet<>();


    // Ratings (child → auto deleted)
    @OneToMany(
            mappedBy = "event",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private Set<EventRating> ratings = new HashSet<>();

    // Tags (shared → DO NOT cascade REMOVE)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "event_tags",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @Column(nullable = false)
    private double averageRating = 0.0;

    @Column(nullable = false)
    private int ratingCount = 0;


    /* =====================
       STATUS
    ===================== */

    public enum EventStatus {
        UPCOMING,
        LIVE,
        ENDED
    }

    @Transient
    public EventStatus getStatus() {
        if (startAt == null) return EventStatus.UPCOMING;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime effectiveEnd =
                endAt != null ? endAt : startAt.plusHours(2);

        if (!now.isBefore(startAt) && now.isBefore(effectiveEnd)) {
            return EventStatus.LIVE;
        }
        if (now.isAfter(effectiveEnd)) {
            return EventStatus.ENDED;
        }
        return EventStatus.UPCOMING;
    }

    /* =====================
       GETTERS / SETTERS
    ===================== */

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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDateTime getStartAt() {
        return startAt;
    }

    public void setStartAt(LocalDateTime startAt) {
        this.startAt = startAt;
    }

    public LocalDateTime getEndAt() {
        return endAt;
    }

    public void setEndAt(LocalDateTime endAt) {
        this.endAt = endAt;
    }

    public Club getClub() {
        return club;
    }

    public void setClub(Club club) {
        this.club = club;
    }

    public Set<EventAttendance> getAttendance() {
        return attendance;
    }

    public void setAttendance(Set<EventAttendance> attendance) {
        this.attendance = attendance;
    }

    public Set<EventRating> getRatings() {
        return ratings;
    }

    public void setRatings(Set<EventRating> ratings) {
        this.ratings = ratings;
    }

    public Set<Tag> getTags() {
        return tags;
    }

    public void setTags(Set<Tag> tags) {
        this.tags = tags;
    }

    /* =====================
       EQUALS / HASHCODE
       (important for Set + orphanRemoval)
    ===================== */

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Event)) return false;
        Event other = (Event) o;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public int getRatingCount() {
        return ratingCount;
    }

    public void setRatingCount(int ratingCount) {
        this.ratingCount = ratingCount;
    }

}
