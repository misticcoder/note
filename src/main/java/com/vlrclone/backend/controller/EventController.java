// src/main/java/com/vlrclone/backend/controller/EventController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.Enums.EventCategory;
import com.vlrclone.backend.Enums.EventVisibility;
import com.vlrclone.backend.Enums.Status;
import com.vlrclone.backend.dto.EventUpdateDto;
import com.vlrclone.backend.model.*;
import com.vlrclone.backend.repository.*;
import com.vlrclone.backend.service.EventService;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository events;
    private final UserRepository users;
    private final EventRatingRepository ratings;
    private final EventService service;
    private final ClubRepository clubs;
    private final EventAttendanceRepository attendances;

    public EventController(
            EventRepository events,
            UserRepository users,
            EventRatingRepository ratings,
            EventService service,
            ClubRepository clubs,
            EventAttendanceRepository attendances
    ) {
        this.events = events;
        this.users = users;
        this.ratings = ratings;
        this.service = service;
        this.clubs = clubs;
        this.attendances = attendances;
    }

    /* =====================
       HELPERS
    ===================== */

    private User byEmail(String email) {
        return (email == null || email.isBlank())
                ? null
                : users.findByEmail(email).orElse(null);
    }

    private boolean isAdmin(User u) {
        return u != null && u.getRole() == User.Role.ADMIN;
    }

    private String normalizeStatus(String status) {
        if (status == null) return "ALL";

        return switch (status.toLowerCase()) {
            case "live", "ongoing" -> "LIVE";
            case "ended", "past" -> "ENDED";
            case "upcoming" -> "UPCOMING";
            default -> "ALL";
        };
    }

    /**
     * Enhanced permission check with club admin support
     */
    private boolean canViewEvent(Event event, User user) {
        if (event == null) {
            return false;
        }

        // Global admin can see everything
        if (isAdmin(user)) {
            return true;
        }

        // Event creator can always see their own events
        if (user != null && event.getAuthor() != null
                && event.getAuthor().getId().equals(user.getId())) {
            return true;
        }

        // Public events are visible to everyone
        if (event.getVisibility() == EventVisibility.PUBLIC) {
            return true;
        }

        // Members-only events require authentication and club membership
        if (event.getVisibility() == EventVisibility.CLUB_MEMBERS) {
            if (user == null || event.getClub() == null) {
                return false;
            }

            Club club = event.getClub();

            // Check if user is club leader/co-leader
            if (club.isLeaderOrCoLeader(user)) {
                return true;
            }

            // Check if user is a club member
            return club.getMembers().stream()
                    .anyMatch(m ->
                            m.getUser() != null &&
                                    m.getUser().getId().equals(user.getId())
                    );

        }

        // Default: deny access
        return false;
    }

    /* =====================
       LIST / SEARCH
    ===================== */

    @GetMapping
    public ResponseEntity<List<EventUpdateDto>> list(
            @RequestParam(required = false) String requesterEmail,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tags,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(required = false) String timePeriod
    ) {
        List<String> tagList = (tags == null || tags.isBlank())
                ? null
                : Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        User user = byEmail(requesterEmail);

        List<EventUpdateDto> visible = service
                .searchEvents(q, tagList, normalizeStatus(status), timePeriod)
                .stream()
                .filter(dto -> {
                    Event e = events.findById(dto.id).orElse(null);
                    return e != null && canViewEvent(e, user);
                })
                .toList();

        return ResponseEntity.ok(visible);
    }

    /* =====================
       GET SINGLE EVENT (FIXED)
    ===================== */

    @GetMapping("/{id}")
    public ResponseEntity<?> get(
            @PathVariable Long id,
            @RequestParam(required = false) String requesterEmail
    ) {
        User user = byEmail(requesterEmail);

        Event event = events.findWithClubAndTagsById(id).orElse(null);

        if (event == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Event not found"));
        }

        if (!canViewEvent(event, user)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Members only event"));
        }

        EventUpdateDto dto = new EventUpdateDto(event);
        dto.myRating = service.getMyRating(event, user);

        return ResponseEntity.ok(dto);
    }

    /* =====================
       CREATE (ADMIN OR CLUB LEADER)
    ===================== */

    @PostMapping
    public ResponseEntity<?> create(
            @RequestParam String requesterEmail,
            @RequestBody EventUpdateDto dto
    ) {
        User me = byEmail(requesterEmail);
        if (me == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Unauthorized"));
        }

        if (dto.title == null || dto.title.isBlank() || dto.startAt == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "title and startAt are required"));
        }

        Event ev = new Event();
        ev.setTitle(dto.title.trim());
        ev.setContent(dto.content != null ? dto.content.trim() : "");
        ev.setLocation(dto.location);
        ev.setStartAt(dto.startAt);
        ev.setEndAt(dto.endAt);
        ev.setAuthor(me);

        EventCategory category =
                dto.category != null
                        ? dto.category
                        : EventCategory.INTERNAL;

        // Validate external link rules
        service.validateExternalEvent(category, dto.externalUrl);

        ev.setCategory(category);
        ev.setExternalUrl(
                category == EventCategory.EXTERNAL
                        ? dto.externalUrl
                        : null
        );


        /* =====================
           CLUB vs GLOBAL EVENT
        ===================== */

        if (dto.clubId != null) {
            Club club = clubs.findById(dto.clubId)
                    .orElseThrow(() -> new IllegalArgumentException("Club not found"));

            boolean allowed = isAdmin(me) || club.isLeaderOrCoLeader(me);

            if (!allowed) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Not allowed to create events for this club"));
            }

            ev.setClub(club);

            // Default: members-only for club events
            ev.setVisibility(
                    dto.visibility != null
                            ? dto.visibility
                            : EventVisibility.CLUB_MEMBERS
            );

        } else {
            // Global event → admin only
            if (!isAdmin(me)) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Admin only"));
            }

            ev.setVisibility(
                    dto.visibility != null
                            ? dto.visibility
                            : EventVisibility.PUBLIC
            );
        }



        /* =====================
           TAGS & ATTENDANCE CODE
        ===================== */

        if (dto.tags != null) {
            ev.setTags(service.resolveTags(dto.tags));
        }

        String code = service.generateCode(8);
        ev.setAttendanceCodeHash(service.sha256Hex(code));

        Event saved = events.save(ev);

        service.notifyClubMembers(saved);
        service.notifyInterestedUsers(saved);



        EventUpdateDto out = new EventUpdateDto(
                events.findWithClubAndTagsById(saved.getId()).orElse(saved)
        );

        return ResponseEntity.ok(Map.of(
                "event", out,
                "attendanceCode", code
        ));
    }

    /* =====================
       UPDATE (ADMIN OR CLUB LEADER)
    ===================== */

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestParam String requesterEmail,
            @RequestBody EventUpdateDto dto
    ) {
        User me = byEmail(requesterEmail);

        Event ev = events.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // Check permissions: global admin OR club leader/co-leader
        boolean canEdit = isAdmin(me) ||
                (ev.getClub() != null && ev.getClub().isLeaderOrCoLeader(me));

        if (!canEdit) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Not authorized to edit this event"));
        }

        if (ev.getStatus() == Event.EventStatus.ENDED) {
            return ResponseEntity.status(409)
                    .body(Map.of("message", "Ended events cannot be modified"));
        }

        if (dto.title != null) ev.setTitle(dto.title.trim());
        if (dto.content != null) ev.setContent(dto.content.trim());
        if (dto.location != null) ev.setLocation(dto.location);
        if (dto.startAt != null) ev.setStartAt(dto.startAt);
        if (dto.endAt != null) ev.setEndAt(dto.endAt);

        // Only global admin can change club association
        if (dto.clubId != null && isAdmin(me)) {
            ev.setClub(
                    clubs.findById(dto.clubId)
                            .orElseThrow(() -> new IllegalArgumentException("Club not found"))
            );
        }

        // Allow visibility change only if appropriate
        if (dto.visibility != null) {
            ev.setVisibility(dto.visibility);
        }

        if (dto.tags != null) {
            if (dto.tags.isEmpty()) {
                ev.getTags().clear();
            } else {
                ev.setTags(service.resolveTags(dto.tags));
            }
        }

        // ===== CATEGORY & EXTERNAL LINK =====
        if (dto.category != null) {
            ev.setCategory(dto.category);

            if (dto.category == EventCategory.INTERNAL) {
                // 🔑 force clear stale external link
                ev.setExternalUrl(null);
            } else if (dto.category == EventCategory.EXTERNAL) {
                // validate + set external link
                service.validateExternalEvent(dto.category, dto.externalUrl);
                ev.setExternalUrl(dto.externalUrl);
            }
        }


        Event saved = events.save(ev);

        return ResponseEntity.ok(
                new EventUpdateDto(
                        events.findWithClubAndTagsById(saved.getId()).orElse(saved)
                )
        );
    }

    /* =====================
       DELETE (ADMIN OR CLUB LEADER)
    ===================== */

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @RequestParam String requesterEmail
    ) {
        User me = byEmail(requesterEmail);

        Event event = events.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // Check permissions: global admin OR club leader/co-leader
        boolean canDelete = isAdmin(me) ||
                (event.getClub() != null && event.getClub().isLeaderOrCoLeader(me));

        if (!canDelete) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Not authorized to delete this event"));
        }

        event.getTags().clear();
        event.setClub(null);

        events.delete(event);

        return ResponseEntity.ok(Map.of("status", "deleted", "id", id));
    }

    /* =====================
       RATINGS
    ===================== */

    @GetMapping("/{id}/rating")
    public ResponseEntity<?> getRating(
            @PathVariable Long id,
            @RequestParam(required = false) String requesterEmail
    ) {
        Event event = events.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User user = byEmail(requesterEmail);

        if (!canViewEvent(event, user)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Members only event"));
        }

        Integer myRating = null;
        if (user != null) {
            myRating = ratings
                    .findByEvent_IdAndUser_Id(id, user.getId())
                    .map(EventRating::getRating)
                    .orElse(null);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("average", event.getAverageRating());
        response.put("count", event.getRatingCount());
        response.put("myRating", myRating);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/rating")
    public ResponseEntity<?> rate(
            @PathVariable Long id,
            @RequestParam String requesterEmail,
            @RequestBody Map<String, Integer> body
    ) {
        User user = byEmail(requesterEmail);
        if (user == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "User not found"));
        }

        Event event = events.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!canViewEvent(event, user)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Members only event"));
        }

        // 1️⃣ Must be ended
        if (event.getStatus() != Event.EventStatus.ENDED) {
            return ResponseEntity.status(409)
                    .body(Map.of("message", "Event not ended"));
        }

        // 2️⃣ Must have attendance record
        EventAttendance attendance = attendances
                .findByEventIdAndUserId(id, user.getId())
                .orElse(null);

        if (attendance == null || attendance.getStatus() != Status.ATTENDED) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Only checked-in attendees can rate"));
        }

        // 3️⃣ Validate rating value
        int rating = body.getOrDefault("rating", 0);
        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Rating must be 1–5"));
        }

        service.saveOrUpdateRating(event, user, rating);

        return getRating(id, requesterEmail);
    }


    @DeleteMapping("/{id}/rating")
    public ResponseEntity<?> deleteRating(
            @PathVariable Long id,
            @RequestParam String requesterEmail
    ) {
        User user = byEmail(requesterEmail);
        if (user == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "User not found"));
        }

        Event event = events.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        service.deleteRating(event, user);
        return getRating(id, requesterEmail);
    }

    /* =====================
       FILTERS
    ===================== */

    @GetMapping("/club/{clubId}")
    public ResponseEntity<?> byClub(
            @PathVariable Long clubId,
            @RequestParam(required = false) String requesterEmail,
            @RequestParam(defaultValue = "all") String status
    ) {
        User user = byEmail(requesterEmail);

        List<EventUpdateDto> allEvents = service.findByClub(clubId, normalizeStatus(status));

        // Filter based on visibility
        List<EventUpdateDto> visible = allEvents.stream()
                .filter(dto -> {
                    Event e = events.findById(dto.id).orElse(null);
                    return e != null && canViewEvent(e, user);
                })
                .toList();

        return ResponseEntity.ok(visible);
    }

    @PostMapping("/{id}/attendance-code/rotate")
    public ResponseEntity<?> rotateAttendanceCode(
            @PathVariable Long id,
            @RequestParam String requesterEmail
    ) {
        User me = byEmail(requesterEmail);
        if (me == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Unauthorized"));
        }

        Event ev = events.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!canViewEvent(ev, me)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Members only event"));
        }

        boolean isOwner = ev.getAuthor() != null
                && ev.getAuthor().getId().equals(me.getId());

        boolean isClubLeader = ev.getClub() != null
                && ev.getClub().isLeaderOrCoLeader(me);

        if (!isAdmin(me) && !isOwner && !isClubLeader) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Forbidden"));
        }

        String newCode = service.generateCode(8);
        ev.setAttendanceCodeHash(service.sha256Hex(newCode));
        events.save(ev);

        return ResponseEntity.ok(Map.of("attendanceCode", newCode));
    }

    @GetMapping("/recommended")
    public ResponseEntity<?> recommended(
            @RequestParam String requesterEmail
    ) {
        User user = byEmail(requesterEmail);
        if (user == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Unauthorized"));
        }

        List<EventUpdateDto> recommended =
                service.getRecommendedEventsForUser(user);

        // Apply visibility rules (important!)
        List<EventUpdateDto> visible = recommended.stream()
                .filter(dto -> {
                    Event e = events.findById(dto.id).orElse(null);
                    return e != null && canViewEvent(e, user);
                })
                .toList();

        return ResponseEntity.ok(visible);
    }
}