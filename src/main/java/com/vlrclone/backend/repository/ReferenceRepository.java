package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.PostReference;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferenceRepository extends JpaRepository<PostReference, Long> {
    void deleteByPostId(Long postId);
}
