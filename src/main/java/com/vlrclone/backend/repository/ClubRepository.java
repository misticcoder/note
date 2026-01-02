package com.vlrclone.backend.repository;

import com.vlrclone.backend.Enums.ClubCategory;
import com.vlrclone.backend.model.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.*;

public interface ClubRepository extends JpaRepository<Club, Long> {
    boolean existsByName(String name);
    List<Club> findTop10ByNameContainingIgnoreCase(String name);
    List<Club> findByCategory(ClubCategory category);
    List<Club> findByCategoryIn(List<ClubCategory> categories);

    List<Club> findByNameContainingIgnoreCase(
            String name,
            Pageable pageable
    );

    List<Club> findAllByOrderByCreatedAtDesc(Pageable pageable);

}

