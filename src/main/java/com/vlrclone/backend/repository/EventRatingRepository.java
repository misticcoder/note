// src/main/java/com/vlrclone/backend/repository/EventRatingRepository.java
package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventRating;
import com.vlrclone.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EventRatingRepository extends JpaRepository<EventRating, Long> {

    Optional<EventRating> findByEventAndUser(Event event, User user);

    Optional<EventRating> findByEvent_IdAndUser_Id(Long eventId, Long userId);

    void deleteByEventAndUser(Event event, User user);

    List<EventRating> findAllByEvent(Event event);

    List<EventRating> findByUserAndEvent_IdIn(User user, Collection<Long> eventIds);

    
}
