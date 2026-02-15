package com.vlrclone.backend.repository;

import com.vlrclone.backend.Enums.ClubCategory;
import com.vlrclone.backend.model.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ClubRepository extends JpaRepository<Club, Long> {
    boolean existsByName(String name);

    // ✅ ADD THESE @EntityGraph ANNOTATIONS
    @EntityGraph(attributePaths = {"members", "members.user"})
    @Override
    List<Club> findAll();

    @EntityGraph(attributePaths = {"members", "members.user", "links", "supervisor"})
    @Override
    Optional<Club> findById(Long id);

    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Club> findByCategory(ClubCategory category);

    // Keep all your other existing methods...
    List<Club> findTop10ByNameContainingIgnoreCase(String name);
    List<Club> findByCategoryIn(List<ClubCategory> categories);
    Optional<Club> findByName(String name);
    List<Club> findByNameContainingIgnoreCase(String name);
    List<Club> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<Club> findAllByOrderByCreatedAtDesc();
    List<Club> findAllByOrderByNameAsc();
    List<Club> findAllByOrderByNameDesc();
    List<Club> findAllByOrderByNameAsc(Pageable pageable);
}