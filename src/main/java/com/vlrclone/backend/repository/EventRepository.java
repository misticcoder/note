package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    boolean existsByTitle(String name);
    List<Event> findTop10ByTitleContainingIgnoreCase(String name);
}
