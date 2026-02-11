package com.vlrclone.backend.repository;

import com.vlrclone.backend.model.Notification;
import com.vlrclone.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Activity tab
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    // Header badge
    long countByUserAndReadFalse(User user);

    // Used for mark-all-as-read
    List<Notification> findByUserAndReadFalse(User user);
}
