package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.EventRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventRatingRepository extends JpaRepository<EventRating, Long> {

    List<EventRating> findByEvent_Id(Long eventId);

    Optional<EventRating> findByEvent_IdAndUser_Id(Long eventId, Long userId);
}


