package com.vlrclone.backend.repository;

import com.vlrclone.backend.Enums.Status;
import com.vlrclone.backend.model.EventAttendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventAttendanceRepository
        extends JpaRepository<EventAttendance, Long> {

    List<EventAttendance> findByEventIdAndStatus(Long eventId, Status status);

    Optional<EventAttendance> findByEventIdAndUserId(Long eventId, Long userId);

    long countByEventIdAndStatus(Long eventId, Status status);

    long countByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, Status status);

    List<EventAttendance> findByUserId(Long userId);
    List<EventAttendance> findByUserIdAndStatusIn(
            Long userId,
            List<Status> statuses
    );

}
