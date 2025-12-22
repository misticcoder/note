package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.News;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NewsRepository extends JpaRepository<News, Long> {
    List<News> findAllByOrderByPublishedDesc();
    List<News> findAllByOrderByPinnedDescPublishedDesc();
}
