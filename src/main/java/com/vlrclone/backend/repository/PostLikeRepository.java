package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    /* =====================
       SINGLE POST OPS
       ===================== */

    long countByPostId(Long postId);

    boolean existsByPostIdAndUsername(Long postId, String username);

    void deleteByPostIdAndUsername(Long postId, String username);

    void deleteAllByPostId(Long postId);


    /* =====================
       BATCH AGGREGATION (FEED OPTIMIZATION)
       ===================== */

    // Get like counts for multiple posts in ONE query
    @Query("""
        select pl.post.id, count(pl)
        from PostLike pl
        where pl.post.id in :ids
        group by pl.post.id
    """)
    List<Object[]> countLikesByPostIds(
            @Param("ids") Collection<Long> ids
    );

    // Get posts liked by a specific user (in one query)
    @Query("""
        select pl.post.id
        from PostLike pl
        where pl.post.id in :ids
          and pl.username = :username
    """)
    List<Long> likedPostIdsForUser(
            @Param("ids") Collection<Long> ids,
            @Param("username") String username
    );
}
