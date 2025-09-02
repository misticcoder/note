package com.vlrclone.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="club_news")
public class ClubNews {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private Long clubId;
    @Column(nullable=false) private Long authorUserId;
    @Column(nullable=false) private String title;
    @Column(nullable=false, length=4000) private String content;
    @Column(nullable=false) private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId(){return id;}
    public Long getClubId(){return clubId;}
    public void setClubId(Long clubId){this.clubId=clubId;}
    public Long getAuthorUserId(){return authorUserId;}
    public void setAuthorUserId(Long v){this.authorUserId=v;}
    public String getTitle(){return title;}
    public void setTitle(String t){this.title=t;}
    public String getContent(){return content;}
    public void setContent(String c){this.content=c;}
    public LocalDateTime getCreatedAt(){return createdAt;}
    public void setCreatedAt(LocalDateTime t){this.createdAt=t;}
}
