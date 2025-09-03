package com.vlrclone.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name= "club_members")
public class ClubMember {
    public enum Role { LEADER, MEMBER}

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false) private Long clubId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Role role = Role.MEMBER;
    @Column(nullable = false) private LocalDateTime joinedAt = LocalDateTime.now();

    public Long getId() {return id;}
    public Long getClubId() {return id;}
    public void setClubId(Long clubId) {this.clubId = clubId;}
    public Long getUserId() {return userId;}
    public void setUserId(Long userId) {this.userId = userId;}
    public Role getRole() {return role;}
    public void setRole(Role role) {this.role = role;}
    public LocalDateTime getJoinedAt() {return joinedAt;}
    public void setJoinedAt(LocalDateTime joinedAt) {this.joinedAt = joinedAt;}

}