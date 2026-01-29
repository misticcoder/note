package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Notification;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.service.CurrentUserService;
import com.vlrclone.backend.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public NotificationController(
            NotificationService notificationService,
            CurrentUserService currentUserService
    ) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    /* =====================
       READ
       ===================== */

    @GetMapping
    public List<Notification> getMyNotifications(HttpServletRequest request) {
        User user = currentUserService.requireUser(request);
        return notificationService.getUserNotifications(user);
    }

    @GetMapping("/unread-count")
    public long getUnreadCount(HttpServletRequest request) {
        User user = currentUserService.requireUser(request);
        return notificationService.getUnreadCount(user);
    }

    /* =====================
       UPDATE
       ===================== */

    @PostMapping("/{id}/read")
    public void markAsRead(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        User user = currentUserService.requireUser(request);
        notificationService.markAsRead(id, user);
    }

    @PostMapping("/read-all")
    public void markAllAsRead(HttpServletRequest request) {
        User user = currentUserService.requireUser(request);
        notificationService.markAllAsRead(user);
    }
}
