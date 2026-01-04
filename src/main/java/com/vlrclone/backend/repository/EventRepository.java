package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository
        extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    /* =====================
       SIMPLE SEARCHES
    ===================== */

    List<Event> findTop10ByTitleContainingIgnoreCase(String name);

    List<Event> findByStartAtAfterOrderByStartAtAsc(
            LocalDateTime now,
            Pageable pageable
    );

    List<Event> findByTitleContainingIgnoreCaseOrderByStartAtDesc(
            String title,
            Pageable pageable
    );

    /* =====================
       TAG SEARCHES
    ===================== */

    @EntityGraph(attributePaths = {"club", "tags"})
    List<Event> findByTagsContaining(Tag tag);

    @EntityGraph(attributePaths = {"club", "tags"})
    List<Event> findByTags_NameIgnoreCase(String name);

    @EntityGraph(attributePaths = {"club", "tags"})
    List<Event> findByTags_NameIgnoreCaseOrderByStartAtAsc(
            String name, Pageable pageable
    );

    @EntityGraph(attributePaths = {"club", "tags"})
    List<Event> findDistinctByTitleContainingIgnoreCaseOrTags_NameIgnoreCaseOrderByStartAtDesc(
            String title,
            String tagName,
            Pageable pageable
    );


    /* =====================
       CLUB SEARCHES
    ===================== */

    @EntityGraph(attributePaths = {"club", "tags"})
    List<Event> findByClubId(Long clubId);

    @EntityGraph(attributePaths = {"club", "tags"})
    List<Event> findByClubIdIn(List<Long> clubIds);

    /* =====================
       SPEC + ID
    ===================== */

    // 🔥 CRITICAL: used by searchEvents(...)
    @Override
    @EntityGraph(attributePaths = {"club", "tags"})
    List<Event> findAll(Specification<Event> spec, Sort sort);

    @EntityGraph(attributePaths = {"club", "tags"})
    Optional<Event> findWithClubAndTagsById(Long id);
}
