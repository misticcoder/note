package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface EventRepository
        extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    boolean existsByTitle(String name);
    List<Event> findTop10ByTitleContainingIgnoreCase(String name);
    List<Event> findByTagsContaining(Tag tag);

}
