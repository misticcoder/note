package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Thread;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ThreadRepository extends JpaRepository<Thread, Long> {
    List<Thread> findAllByOrderByPublishedDesc();
    List<Thread> findTop10ByTitleContainingIgnoreCase(String name);

}
