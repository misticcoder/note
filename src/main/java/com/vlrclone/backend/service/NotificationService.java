package com.vlrclone.backend.service;

import com.vlrclone.backend.Enums.NotificationType;
import com.vlrclone.backend.dto.NotificationDto;
import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Notification;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.NotificationRepository;
import com.vlrclone.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;


import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;

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
        return notificationRepository.countByUserAndReadFalse(user);
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
                notificationRepository.findByUserAndReadFalse(user);

        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
    @Transactional
    public void notifyClubMembersEventCreated(Event event) {

        if (event.getClub() == null) return;

        Club club = event.getClub();
        User creator = event.getAuthor();

        club.getMembers().forEach(member -> {

            User user = member.getUser();

            if (user == null) return;

            // 🔒 Skip event creator
            if (creator != null && creator.getId().equals(user.getId())) {
                return;
            }

            notifyUser(
                    user,
                    NotificationType.EVENT_CREATED,
                    "New event in " + club.getName() + ": " + event.getTitle(),
                    event.getId(),
                    club.getId(),
                    null,
                    null,
                    null
            );
        });
    }


}