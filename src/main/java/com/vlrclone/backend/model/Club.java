package com.vlrclone.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.vlrclone.backend.Enums.ClubCategory;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clubs", indexes = {
        @Index(name = "idx_club_category", columnList = "category"),
        @Index(name = "idx_club_name", columnList = "name"),
        @Index(name = "idx_club_created_at", columnList = "createdAt")
})
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

    @OneToMany(
            mappedBy = "club",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @JsonManagedReference
    private List<ClubLink> links = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "supervisor_id")
    private User supervisor;


    public Club() {
        // Required by JPA
    }

    public Club(ClubCategory category, String name, String description) {
        this.category = category;
        this.name = name;
        this.description = description;
        this.createdAt = LocalDateTime.now();
    }




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

    public boolean isLeaderOrCoLeader(User user) {
        if (user == null || members == null) return false;

        return members.stream().anyMatch(m ->
                m.getUser() != null &&
                        m.getUser().getId().equals(user.getId()) &&
                        (m.getRole() == ClubMember.Role.LEADER ||
                                m.getRole() == ClubMember.Role.CO_LEADER)
        );
    }


    public List<ClubLink> getLinks() { return links; }
    public void setLinks(List<ClubLink> links) { this.links = links; }

    public User getSupervisor() { return supervisor; }
    public void setSupervisor(User supervisor) { this.supervisor = supervisor; }
}
