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
       CORE SEARCH (USED BY searchEventsEntities)
       ===================== */

    @Override
    @EntityGraph(attributePaths = {
            "club",
            "club.members",
            "club.members.user",
            "tags",
            "author"
    })
    List<Event> findAll(Specification<Event> spec, Sort sort);


    /* =====================
       SIMPLE SEARCHES
       ===================== */

    @EntityGraph(attributePaths = {
            "club",
            "club.members",
            "club.members.user",
            "tags",
            "author"
    })
    List<Event> findByStartAtAfter(LocalDateTime now);

    @EntityGraph(attributePaths = {
            "club",
            "tags",
            "author"
    })
    List<Event> findTop10ByTitleContainingIgnoreCase(String name);

    @EntityGraph(attributePaths = {
            "club",
            "tags",
            "author"
    })
    List<Event> findByStartAtAfterOrderByStartAtAsc(
            LocalDateTime now,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "club",
            "tags",
            "author"
    })
    List<Event> findByTitleContainingIgnoreCaseOrderByStartAtDesc(
            String title,
            Pageable pageable
    );


    /* =====================
       TAG SEARCHES
       ===================== */

    @EntityGraph(attributePaths = {
            "club",
            "club.members",
            "club.members.user",
            "tags",
            "author"
    })
    List<Event> findByTagsContaining(Tag tag);

    @EntityGraph(attributePaths = {
            "club",
            "club.members",
            "club.members.user",
            "tags",
            "author"
    })
    List<Event> findByTags_NameIgnoreCase(String name);

    @EntityGraph(attributePaths = {
            "club",
            "club.members",
            "club.members.user",
            "tags",
            "author"
    })
    List<Event> findByTags_NameIgnoreCaseOrderByStartAtAsc(
            String name,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "club",
            "tags",
            "author"
    })
    List<Event> findByTags_NameIgnoreCaseAndStartAtAfter(
            String tag,
            LocalDateTime time
    );

    @EntityGraph(attributePaths = {
            "club",
            "club.members",
            "club.members.user",
            "tags",
            "author"
    })
    List<Event> findDistinctByTitleContainingIgnoreCaseOrTags_NameIgnoreCaseOrderByStartAtDesc(
            String title,
            String tagName,
            Pageable pageable
    );


    /* =====================
       CLUB SEARCHES
       ===================== */

    @EntityGraph(attributePaths = {
            "club",
            "club.members",
            "club.members.user",
            "tags",
            "author"
    })
    List<Event> findByClubId(Long clubId);

    @EntityGraph(attributePaths = {
            "club",
            "club.members",
            "club.members.user",
            "tags",
            "author"
    })
    List<Event> findByClubIdIn(List<Long> clubIds);


    /* =====================
       SINGLE EVENT FETCH
       ===================== */

    @EntityGraph(attributePaths = {
            "club",
            "club.members",
            "club.members.user",
            "tags",
            "author"
    })
    Optional<Event> findWithClubAndTagsById(Long id);


    /* =====================
       LIGHTWEIGHT QUERY
       ===================== */

    List<Event> findByClubIdInAndStartAtAfter(
            List<Long> clubIds,
            LocalDateTime time
    );
}
