package com.vlrclone.backend.repository;

import com.vlrclone.backend.Enums.ClubCategory;
import com.vlrclone.backend.model.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ClubRepository extends JpaRepository<Club, Long> {
    boolean existsByName(String name);

    // Add @EntityGraph to prevent N+1 queries
    @EntityGraph(attributePaths = {"members", "members.user", "links", "supervisor"})
    @Override
    List<Club> findAll();

    @EntityGraph(attributePaths = {"members", "members.user", "links", "supervisor"})
    @Override
    Optional<Club> findById(Long id);

    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Club> findTop10ByNameContainingIgnoreCase(String name);

    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Club> findByCategory(ClubCategory category);

    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Club> findByCategoryIn(List<ClubCategory> categories);

    Optional<Club> findByName(String name);

    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Club> findByNameContainingIgnoreCase(String name);

    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Club> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Club> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Club> findAllByOrderByNameAsc();

    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Club> findAllByOrderByNameDesc();

    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Club> findAllByOrderByNameAsc(Pageable pageable);
}