package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    long countByPostId(Long postId);
    boolean existsByPostIdAndUsername(Long postId, String username);
    void deleteByPostIdAndUsername(Long postId, String username);
    // PostLikeRepository
    void deleteAllByPostId(Long postId);

}
