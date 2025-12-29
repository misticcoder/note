package com.vlrclone.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String author; // username

    @Column(nullable = false, length = 500)
    private String content;

    @OneToMany(
            mappedBy = "post",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("position ASC")
    private List<PostImage> images = new ArrayList<>();


    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private boolean pinned = false;

    private LocalDateTime pinnedAt;

    @OneToMany(
            mappedBy = "post",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<PostReference> references = new ArrayList<>();

    @Column(nullable = false)
    private boolean announcement = false;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    @Column
    private LocalDateTime publishAt;




    public void addReference(PostReference ref) {
        references.add(ref);
        ref.setPost(this);
    }

    public void removeReference(PostReference ref) {
        references.remove(ref);
        ref.setPost(null);
    }


    public Long getId() { return id; }
    public String getAuthor() { return author; }
    public String getContent() { return content; }
    public List<PostImage> getImages() { return images; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setAuthor(String author) { this.author = author; }
    public void setContent(String content) { this.content = content; }
    public void setImages(List<PostImage> images) { this.images = images; }

    public void addImage(PostImage image) {
        images.add(image);
        image.setPost(this);
    }

    public void removeImage(PostImage image) {
        images.remove(image);
        image.setPost(null);
    }

    @Column(nullable = false)
    private int shareCount = 0;

    public int getShareCount() {
        return shareCount;
    }

    public void incrementShareCount() {
        this.shareCount++;
    }

    public LocalDateTime getPinnedAt() { return pinnedAt; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }
    public boolean isPinned() { return pinned; }
    public void setPinnedAt(LocalDateTime pinnedAt) {
        this.pinnedAt = pinnedAt;
    }
    public List<PostReference> getReferences() { return references; }

    public void clearReferences() {
        for (PostReference ref : new ArrayList<>(references)) {
            removeReference(ref);
        }
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public boolean isAnnouncement() {
        return announcement;
    }

    public void setAnnouncement(boolean announcement) {
        this.announcement = announcement;
    }

    public LocalDateTime getPublishAt() {
        return publishAt;
    }

    public void setPublishAt(LocalDateTime publishAt) {
        this.publishAt = publishAt;
    }
}
