package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Thread;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThreadRepository extends JpaRepository<Thread, Long> {}
