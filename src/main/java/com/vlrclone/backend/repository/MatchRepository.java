package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchRepository extends JpaRepository<Match, Long> {
}
