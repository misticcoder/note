package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    /* =====================
       BASIC QUERIES
       ===================== */

    List<Comment> findByThreadIdOrderByCreatedAtAsc(Long threadId);

    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);

    List<Comment> findByEventIdOrderByCreatedAtAsc(Long eventId);

    List<Comment> findByEventIdAndParentIdIsNullOrderByCreatedAtDesc(Long eventId);

    List<Comment> findByParentIdOrderByCreatedAtAsc(Long parentId);

    void deleteAllByPostId(Long postId);

    long countByPostIdAndParentIdIsNull(Long postId);


    /* =====================
       BATCH FEED OPTIMIZATION
       ===================== */

    @Query("""
        select c.postId, count(c)
        from Comment c
        where c.postId in :ids
          and c.parentId is null
        group by c.postId
    """)
    List<Object[]> countTopLevelCommentsByPostIds(
            @Param("ids") Collection<Long> ids
    );
}
