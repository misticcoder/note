// src/main/java/com/vlrclone/backend/model/ClubLink.java
package com.vlrclone.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.vlrclone.backend.Enums.LinkType;
import jakarta.persistence.*;

@Entity
public class ClubLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    @JsonBackReference
    private Club club;

    @Enumerated(EnumType.STRING)
    private LinkType type;

    @Column(nullable = false, length = 512)
    private String url;

    // NEW FIELD
    @Column(length = 100)
    private String displayName;

    // Existing getters/setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Club getClub() {
        return club;
    }

    public void setClub(Club club) {
        this.club = club;
    }

    public LinkType getType() {
        return type;
    }

    public void setType(LinkType type) {
        this.type = type;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    // NEW GETTER/SETTER
    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
}