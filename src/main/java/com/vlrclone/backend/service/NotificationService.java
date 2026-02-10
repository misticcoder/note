package com.vlrclone.backend.service;

import com.vlrclone.backend.Enums.NotificationType;
import com.vlrclone.backend.dto.NotificationDto;
import com.vlrclone.backend.model.Notification;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.NotificationRepository;
import jakarta.transaction.Transactional;
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
            NotificationType type,
            String message,
            Long eventId,
            Long clubId,
            Long commentId,
            Long threadId,
            Long postId
    ) {
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setMessage(message);
        n.setRelatedEventId(eventId);
        n.setRelatedClubId(clubId);
        n.setRelatedCommentId(commentId);
        n.setRelatedThreadId(threadId);
        n.setRelatedPostId(postId);
        n.setRead(false);

        notificationRepository.save(n);
    }


    /* =====================
       Read
       ===================== */

    @Transactional
    public List<NotificationDto> getUserNotifications(User user) {
        List<Notification> notifications =
                notificationRepository.findByUserOrderByCreatedAtDesc(user);

        // ✅ Just return the notifications, don't auto-mark as read
        return notifications.stream()
                .map(NotificationDto::from)
                .toList();
    }




    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    /* =====================
       Update
       ===================== */

    @Transactional
    public void markAsRead(Long notificationId, User user) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!n.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        if (!n.isRead()) {
            n.setRead(true);
            notificationRepository.save(n);
        }
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread =
                notificationRepository.findByUserAndIsReadFalse(user);

        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}