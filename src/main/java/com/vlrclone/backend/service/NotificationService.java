package com.vlrclone.backend.service;

import com.vlrclone.backend.model.Notification;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /* =====================
       Creation
       ===================== */

    public void notifyUser(
            User user,
            String type,
            String message,
            Long eventId,
            Long clubId
    ) {
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setMessage(message);
        n.setRelatedEventId(eventId);
        n.setRelatedClubId(clubId);
        n.setRead(false);

        notificationRepository.save(n);
    }

    /* =====================
       Read operations
       ===================== */

    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }

    /* =====================
       Update operations
       ===================== */

    public void markAsRead(Long notificationId, User user) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!n.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        n.setRead(true);
        notificationRepository.save(n);
    }

    public void markAllAsRead(User user) {
        List<Notification> notifications =
                notificationRepository.findByUserOrderByCreatedAtDesc(user);

        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }
}
