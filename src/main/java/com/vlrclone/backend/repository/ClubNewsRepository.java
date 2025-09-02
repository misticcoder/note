package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.ClubNews;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClubNewsRepository extends JpaRepository<ClubNews, Long> {
    List<ClubNews> findByClubIdOrderByCreatedAtDesc(Long clubId);
}
