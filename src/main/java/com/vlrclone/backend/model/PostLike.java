package com.vlrclone.backend.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "post_likes",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"post_id", "username"})
        }
)
public class PostLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(nullable = false)
    private String username;

    public PostLike() {}

    public PostLike(Post post, String username) {
        this.post = post;
        this.username = username;
    }

    public Long getId() { return id; }
    public Post getPost() { return post; }
    public String getUsername() { return username; }
}
