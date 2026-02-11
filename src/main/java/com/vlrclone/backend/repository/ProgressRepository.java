package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Progress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProgressRepository
        extends JpaRepository<Progress, Long> {

    List<Progress> findByUserId(Long userId);

    Optional<Progress> findByUserIdAndTaskId(Long userId, Integer taskId);
}
