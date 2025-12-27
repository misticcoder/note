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

    public LocalDateTime getPinnedAt() { return pinnedAt; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }
    public boolean isPinned() { return pinned; }
    public void setPinnedAt(LocalDateTime pinnedAt) {
        this.pinnedAt = pinnedAt;
    }
    public List<PostReference> getReferences() { return references; }
    public void setReferences(List<PostReference> references) { this.references = references; }
}
