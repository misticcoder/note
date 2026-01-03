package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;


import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository
        extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    boolean existsByTitle(String name);
    List<Event> findTop10ByTitleContainingIgnoreCase(String name);
    List<Event> findByTagsContaining(Tag tag);
    List<Event> findByClubId(Long clubId);
    List<Event> findByClubIdAndStartAtAfter(Long clubId, LocalDateTime now);
    List<Event> findByClub_Id(Long clubId);

    List<Event> findByStartAtAfterOrderByStartAtAsc(
            LocalDateTime now,
            Pageable pageable
    );

    List<Event> findByTitleContainingIgnoreCaseOrderByStartAtDesc(
            String title,
            Pageable pageable
    );

    List<Event> findByTags_NameIgnoreCase(String name);

    List<Event> findByTags_NameIgnoreCaseOrderByStartAtAsc(
            String name, Pageable pageable
    );

    List<Event> findDistinctByTitleContainingIgnoreCaseOrTags_NameIgnoreCaseOrderByStartAtDesc(
            String title,
            String tagName,
            Pageable pageable
    );

    List<Event> findByClubIdIn(List<Long> clubIds);


}
