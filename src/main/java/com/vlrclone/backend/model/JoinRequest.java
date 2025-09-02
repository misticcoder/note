package com.vlrclone.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity @Table(name="club_join_requests", uniqueConstraints =@UniqueConstraint(columnNames ={"clubId", "userId"}))
public class JoinRequest {
    public enum Status { PENDING, APPROVED, REJECTED }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private Long clubId;
    @Column(nullable=false) private Long userId;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Status status = Status.PENDING;
    @Column(nullable=false) private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() {return id;}
    public Long getClubId() {return clubId;}
    public void setClubId(Long clubId) {this.clubId = clubId;}
    public Long getUserId() {return userId;}
    public void setUserId(Long userId) {this.userId = userId;}
    public Status getStatus() {return status;}
    public void setStatus(Status status) {this.status = status;}
    public LocalDateTime getCreatedAt() {return createdAt;}
    public void setCreatedAt(LocalDateTime createdAt) {this.createdAt = createdAt;}
}
