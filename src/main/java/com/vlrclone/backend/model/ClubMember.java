package com.vlrclone.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "club_members", indexes = {
        @Index(name = "idx_member_club_id", columnList = "club_id"),
        @Index(name = "idx_member_user_id", columnList = "user_id"),
        @Index(name = "idx_member_role", columnList = "role"),
        @Index(name = "idx_member_club_user", columnList = "club_id, user_id", unique = true)
})
public class ClubMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "club_id")
    @JsonIgnore
    private Club club;


    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private Role role;

    public enum Role {
        LEADER, CO_LEADER, MEMBER
    }

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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
