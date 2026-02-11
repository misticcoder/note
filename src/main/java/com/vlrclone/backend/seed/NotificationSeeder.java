package com.vlrclone.backend.seed;

import com.vlrclone.backend.Enums.NotificationType;
import com.vlrclone.backend.model.Notification;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.NotificationRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Order(7)
@Component
public class NotificationSeeder {

    private final NotificationRepository notificationRepo;
    private final UserRepository userRepo;

    public NotificationSeeder(NotificationRepository notificationRepo, UserRepository userRepo) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
    }

    public void seed() {

        if (notificationRepo.count() > 0) return;

        for (User user : userRepo.findAll()) {

            for (int i = 0; i < 10; i++) {

                Notification n = new Notification();
                n.setUser(user);
                n.setMessage("Test notification " + i);
                n.setType(NotificationType.EVENT_CREATED);
                n.setRead(false);

                notificationRepo.save(n);
            }
        }
    }
}
