package com.vlrclone.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "comments")
public class Comment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long threadId;
    @Column(nullable = false)
    private String username;
    @Column(nullable = false, length = 400)
    private String comment;
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(
            mappedBy = "comment",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<CommentReaction> reactions = new ArrayList<>();


    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}
    public Long getThreadId() {return threadId;}
    public void setThreadId(Long threadId) {this.threadId = threadId;}
    public String getUsername() {return username;}
    public void setUsername(String username) {this.username = username;}
    public String getComment() {return comment;}
    public void setComment(String comment) {this.comment = comment;}
    public LocalDateTime getCreatedAt() {return createdAt;}
    public void setCreatedAt(LocalDateTime createdAt) {this.createdAt = createdAt;}
    public List<CommentReaction> getReactions() {return reactions;}
    public void setReactions(List<CommentReaction> reactions) {this.reactions = reactions;}

}