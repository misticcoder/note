package com.vlrclone.backend.dto;

import com.vlrclone.backend.model.Tag;
import com.vlrclone.backend.model.User;

import java.util.List;

public class UserProfileDto {
    public Long id;
    public String username;
    public User.Role role;
    public String displayName;
    public String avatarUrl;
    public String bio;

    public int eventsJoined;
    public int eventsAttended;
    public int eventsMissed;
    public int participationScore;

    public List<String> tags;


    public UserProfileDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
    public User.Role getRole() {
        return role;
    }
    public void setRole(User.Role role) {
        this.role = role;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public int getEventsJoined() {
        return eventsJoined;
    }

    public void setEventsJoined(int eventsJoined) {
        this.eventsJoined = eventsJoined;
    }

    public int getEventsAttended() {
        return eventsAttended;
    }

    public void setEventsAttended(int eventsAttended) {
        this.eventsAttended = eventsAttended;
    }

    public int getParticipationScore() {
        return participationScore;
    }

    public void setParticipationScore(int participationScore) {
        this.participationScore = participationScore;
    }

}
