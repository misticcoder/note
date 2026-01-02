package com.vlrclone.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vlrclone.backend.Enums.ClubCategory;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "clubs")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Club {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClubCategory category;


    @Column(length = 50)
    private String name;
    @Column
    private String description;
    @Column
    private LocalDateTime createdAt;

    @Column
    private String logoUrl;

    @OneToMany(mappedBy = "club")
    private List<ClubMember> members;


    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public ClubCategory getCategory() { return category; }
    public void setCategory(ClubCategory category) { this.category = category; }

    public List<ClubMember> getMembers() { return members; }
    public void setMembers(List<ClubMember> members) { this.members = members; }

}
