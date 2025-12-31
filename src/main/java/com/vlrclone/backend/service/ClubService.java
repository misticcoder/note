package com.vlrclone.backend.service;

import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.Enums.ClubCategory;
import com.vlrclone.backend.repository.ClubRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClubService {

    private final ClubRepository clubRepo;

    public ClubService(ClubRepository clubRepo) {
        this.clubRepo = clubRepo;
    }

    /* =========================
       READ
    ========================= */

    public List<Club> findAll() {
        return clubRepo.findAll();
    }

    public List<Club> findByCategory(ClubCategory category) {
        return clubRepo.findByCategory(category);
    }

    public Club findById(Long id) {
        return clubRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Club not found"));
    }

    /* =========================
       CREATE
    ========================= */

    public Club createClub(
            String name,
            String description,
            ClubCategory category
    ) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Club name required");
        }

        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Club description required");
        }

        if (category == null) {
            category = ClubCategory.OTHER;
        }

        Club club = new Club();
        club.setName(name.trim());
        club.setDescription(description.trim());
        club.setCategory(category);
        club.setCreatedAt(LocalDateTime.now());

        return clubRepo.save(club);
    }

    /**
     * Groups clubs by category and returns top N per category
     * sorted by member count (descending).
     */
    public Map<ClubCategory, List<Club>> topClubsByCategory(int limit) {

        List<Club> allClubs = clubRepo.findAll();

        return allClubs.stream()
                .filter(c -> c.getCategory() != null)
                .collect(Collectors.groupingBy(
                        Club::getCategory,
                        LinkedHashMap::new,
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> list.stream()
                                        .sorted((a, b) ->
                                                Integer.compare(
                                                        b.getMembers().size(),
                                                        a.getMembers().size()
                                                )
                                        )
                                        .limit(limit)
                                        .toList()
                        )
                ));
    }
}
