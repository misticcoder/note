package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.ClubLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClubLinkRepository extends JpaRepository<ClubLink, Long> {
    List<ClubLink> findByClubId(Long clubId);
}
