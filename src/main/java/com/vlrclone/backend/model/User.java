package com.vlrclone.backend.model;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING) // store enum name in DB
    @Column(nullable = false)
    private Role role;// STUDENT or ADMIN

    @Column(nullable = false)
    private boolean protectedAccount = false;

    @Column(length = 60)
    private String displayName;

    @Column(length = 200)
    private String bio;

    @Column
    private String avatarUrl;

    @Column(nullable = false)
    private int participationScore = 0;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_tags",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();


    public enum Role {
        ADMIN,
        STUDENT,
        GUEST
    }

    // Constructors
    public User() {
        // required by JPA
    }

    public User(
            String username,
            String email,
            String password,
            Role role
    ) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
    }



    // Getters and Setters
    public Long getId() { return id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public boolean isProtectedAccount() { return protectedAccount; }
    public void setProtectedAccount(boolean protectedAccount) { this.protectedAccount = protectedAccount; }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public int getParticipationScore() {
        return participationScore;
    }

    public void setParticipationScore(int participationScore) {
        this.participationScore = participationScore;
    }

    public Set<Tag> getTags() {
        return tags;
    }
    public void setTags(Set<Tag> tags) {
        this.tags = tags;
    }
}
