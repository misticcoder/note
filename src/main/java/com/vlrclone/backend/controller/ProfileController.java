package com.vlrclone.backend.controller;

import com.vlrclone.backend.dto.*;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Notification;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.UserRepository;
import com.vlrclone.backend.service.CurrentUserService;
import com.vlrclone.backend.service.EventService;
import com.vlrclone.backend.service.NotificationService;
import com.vlrclone.backend.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/me")
public class ProfileController {

    private final UserProfileService profileService;
    private final CurrentUserService currentUser;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EventService eventService;
    private final NotificationService notificationService;

    public ProfileController(
            UserProfileService profileService,
            CurrentUserService currentUser,
            UserRepository userRepository,
            EventRepository eventRepository,
            EventService eventService,
            NotificationService notificationService
    ) {
        this.profileService = profileService;
        this.currentUser = currentUser;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.eventService = eventService;
        this.notificationService = notificationService;
    }

    private User byEmail(String email) {
        return (email == null || email.isBlank())
                ? null
                : userRepository.findByEmail(email).orElse(null);
    }

    /* ─────────────────────────────
       PROFILE
    ───────────────────────────── */

    @GetMapping("/profile")
    public UserProfileDto myProfile(HttpServletRequest request) {
        User user = currentUser.requireUser(request);
        return profileService.getProfile(user.getId());
    }

    @PatchMapping("/profile")
    public UserProfileDto updateProfile(
            HttpServletRequest request,
            @RequestBody UpdateProfileDto body
    ) {
        User user = currentUser.requireUser(request);
        return profileService.updateProfile(user.getId(), body);
    }



    /* ─────────────────────────────
       EVENTS
    ───────────────────────────── */

    @GetMapping("/events")
    public List<UserEventDto> myEvents(HttpServletRequest request) {
        User user = currentUser.requireUser(request);
        return profileService.getUserEvents(user.getId());
    }


    /* ─────────────────────────────
       AVATAR UPLOAD  ✅ FIXED
    ───────────────────────────── */

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserProfileDto uploadAvatar(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file
    ) {
        User user = currentUser.requireUser(request);

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty file");
        }

        String originalName = Objects.requireNonNull(file.getOriginalFilename());
        int dot = originalName.lastIndexOf(".");
        if (dot < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file type");
        }

        String ext = originalName.substring(dot).toLowerCase();

        // Optional: basic image whitelist
        if (!ext.matches("\\.(png|jpg|jpeg|webp)")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image type");
        }

        try {
            String filename = "avatars/user-" + user.getId() + "-" + System.currentTimeMillis() + ext;
            Path path = Paths.get("uploads").resolve(filename);

            Files.createDirectories(path.getParent());
            Files.write(path, file.getBytes());

            // 🔑 THIS MUST MATCH WebConfig
            user.setAvatarUrl("/uploads/" + filename);
            userRepository.save(user);

            return profileService.getProfile(user.getId());

        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to save avatar",
                    e
            );
        }
    }

    @GetMapping("/clubs")
    public List<UserClubDto> myClubs(HttpServletRequest request) {
        User user = currentUser.requireUser(request);
        return profileService.getUserClubs(user.getId());
    }

    /* ─────────────────────────────
   INTEREST TAGS
───────────────────────────── */

    @GetMapping("/tags")
    public List<String> myTags(HttpServletRequest request) {
        User user = currentUser.requireUser(request);

        return user.getTags()
                .stream()
                .map(tag -> tag.getName())
                .toList();
    }

    @PutMapping("/tags")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateMyTags(
            HttpServletRequest request,
            @RequestBody List<String> tags
    ) {
        User user = currentUser.requireUser(request);
        profileService.updateUserTags(user.getId(), tags);
    }

    @GetMapping("/recommendations")
    public List<EventUpdateDto> recommendations(HttpServletRequest request) {
        User user = currentUser.requireUser(request);
        return eventService.getRecommendedEventsForUser(user);
    }

   /* ─────────────────────────────
   ACTIVITY / NOTIFICATIONS
───────────────────────────── */

    @GetMapping("/activity")
    public List<NotificationDto> myNotifications(HttpServletRequest request) {
        User user = currentUser.requireUser(request);
        return notificationService.getUserNotifications(user);
    }


    @GetMapping("/activity/unread-count")
    public long unreadActivityCount(HttpServletRequest request) {
        User user = currentUser.requireUser(request);
        return notificationService.getUnreadCount(user);
    }

    @PostMapping("/activity/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllActivityRead(HttpServletRequest request) {
        User user = currentUser.requireUser(request);
        notificationService.markAllAsRead(user);
    }


}
