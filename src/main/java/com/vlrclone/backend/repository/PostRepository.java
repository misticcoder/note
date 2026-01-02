package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Post;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByOrderByCreatedAtDesc();
    List<Post> findAllByOrderByPinnedDescPinnedAtDescCreatedAtDesc();
    List<Post> findByEventIdOrderByAnnouncementDescCreatedAtDesc(Long eventId);
    List<Post> findByEventIdOrderByCreatedAtDesc(Long eventId);

    List<Post> findByEventIsNullOrderByCreatedAtDesc();

    List<Post> findByContentContainingIgnoreCase(
            String content,
            Pageable pageable
    );

    List<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

}
