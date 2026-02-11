package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.UsabilityResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsabilityResultRepository
        extends JpaRepository<UsabilityResult, Long> {
}

