package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findByName(String name);

    List<Tag> findAllByOrderByNameAsc();

    List<Tag> findByNameContainingIgnoreCase(
            String name,
            Pageable pageable
    );

    List<Tag> findAllByOrderByNameAsc(Pageable pageable);

    Optional<Tag> findByNameIgnoreCase(String name);




}
