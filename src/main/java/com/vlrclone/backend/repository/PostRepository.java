package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Post;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    /* =====================
       CORE LISTING (FIX N+1)
       ===================== */

    @EntityGraph(attributePaths = {
            "author",
            "event"
    })
    List<Post> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {
            "author",
            "event"
    })
    List<Post> findAllByOrderByPinnedDescPinnedAtDescCreatedAtDesc();

    @EntityGraph(attributePaths = {
            "author",
            "event"
    })
    List<Post> findByEventIdOrderByAnnouncementDescCreatedAtDesc(Long eventId);

    @EntityGraph(attributePaths = {
            "author",
            "event"
    })
    List<Post> findByEventIdOrderByCreatedAtDesc(Long eventId);

    @EntityGraph(attributePaths = {
            "author"
    })
    List<Post> findByEventIsNullOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {
            "author",
            "event"
    })
    List<Post> findByContentContainingIgnoreCase(
            String content,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "author",
            "event"
    })
    List<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {
            "event",
            "images",
            "references"
    })
    Optional<Post> findDetailedById(Long id);

}
