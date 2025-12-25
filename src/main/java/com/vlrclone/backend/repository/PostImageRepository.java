package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostImageRepository extends JpaRepository<PostImage, Long> {
}
