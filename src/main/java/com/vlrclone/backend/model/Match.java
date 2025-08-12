package com.vlrclone.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String teamA;
    private String teamB;
    private LocalDateTime matchTime;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTeamA() { return teamA; }
    public void setTeamA(String teamA) { this.teamA = teamA; }

    public String getTeamB() { return teamB; }
    public void setTeamB(String teamB) { this.teamB = teamB; }

    public LocalDateTime getMatchTime() { return matchTime; }
    public void setMatchTime(LocalDateTime matchTime) { this.matchTime = matchTime; }
}
