package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.EventAttendance;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;
import java.util.Optional;

public interface EventAttendanceRepository extends JpaRepository<EventAttendance, Long> {

    List<EventAttendance> findByEventIdAndStatus(Long eventId, String status);

    Optional<EventAttendance> findByEventIdAndUserId(Long eventId, Long userId);

    long countByEventIdAndStatus(Long eventId, String status);
}


