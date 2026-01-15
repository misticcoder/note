// src/main/java/com/vlrclone/backend/controller/EventController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.Enums.EventVisibility;
import com.vlrclone.backend.dto.EventUpdateDto;
import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventRating;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.ClubRepository;
import com.vlrclone.backend.repository.EventRatingRepository;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.UserRepository;
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

    public EventController(
            EventRepository events,
            UserRepository users,
            EventRatingRepository ratings,
            EventService service,
            ClubRepository clubs
    ) {
        this.events = events;
        this.users = users;
        this.ratings = ratings;
        this.service = service;
        this.clubs = clubs;
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

    /* =====================
       LIST / SEARCH
    ===================== */

    @GetMapping
    public ResponseEntity<List<EventUpdateDto>> list(
            @RequestParam(required = false) String requesterEmail,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tags,
            @RequestParam(defaultValue = "all") String status
    )
 {
        List<String> tagList = (tags == null || tags.isBlank())
                ? null
                : Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

     User user = byEmail(requesterEmail);

     List<EventUpdateDto> visible = service
             .searchEvents(q, tagList, normalizeStatus(status))
             .stream()
             .filter(dto -> {
                 if (dto.visibility == EventVisibility.PUBLIC) return true;
                 if (user == null) return false;

                 return dto.clubId != null &&
                         clubs.findById(dto.clubId)
                                 .map(c -> c.getMembers().stream()
                                         .anyMatch(m -> m.getUserId().equals(user.getId())))
                                 .orElse(false);
             })
             .toList();

     return ResponseEntity.ok(visible);
    }

    /* =====================
       GET SINGLE EVENT
    ===================== */

    @GetMapping("/{id}")
    public ResponseEntity<?> get(
            @PathVariable Long id,
            @RequestParam(required = false) String requesterEmail
    ) {
        User user = byEmail(requesterEmail);

        return events.findWithClubAndTagsById(id)
                .map(e -> {

                    if (!canViewEvent(e, user)) {
                        return ResponseEntity.status(403)
                                .body(Map.of("message", "Members only event"));
                    }

                    EventUpdateDto dto = new EventUpdateDto(e);
                    dto.myRating = service.getMyRating(e, user);
                    return ResponseEntity.ok(dto);
                })
                .orElseGet(() ->
                        ResponseEntity.status(404)
                                .body((EventUpdateDto) Map.of("message", "Event not found"))
                );
    }

    /* =====================
       CREATE (ADMIN)
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
        ev.setCreatedBy(me);

    /* =====================
       CLUB vs GLOBAL EVENT
    ===================== */

        if (dto.clubId != null) {
            Club club = clubs.findById(dto.clubId)
                    .orElseThrow(() -> new IllegalArgumentException("Club not found"));

            boolean allowed =
                    isAdmin(me) || club.isLeaderOrCoLeader(me);

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

        EventUpdateDto out = new EventUpdateDto(
                events.findWithClubAndTagsById(saved.getId()).orElse(saved)
        );

        return ResponseEntity.ok(Map.of(
                "event", out,
                "attendanceCode", code
        ));
    }

    /* =====================
       UPDATE (ADMIN)
    ===================== */

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestParam String requesterEmail,
            @RequestBody EventUpdateDto dto
    ) {
        User me = byEmail(requesterEmail);
        if (!isAdmin(me)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Admin only"));
        }

        Event ev = events.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (ev.getStatus() == Event.EventStatus.ENDED) {
            return ResponseEntity.status(409)
                    .body(Map.of("message", "Ended events cannot be modified"));
        }

        if (dto.title != null) ev.setTitle(dto.title.trim());
        if (dto.content != null) ev.setContent(dto.content.trim());
        if (dto.location != null) ev.setLocation(dto.location);
        if (dto.startAt != null) ev.setStartAt(dto.startAt);
        if (dto.endAt != null) ev.setEndAt(dto.endAt);

        if (dto.clubId != null) {
            ev.setClub(
                    clubs.findById(dto.clubId)
                            .orElseThrow(() -> new IllegalArgumentException("Club not found"))
            );
        }

        if (dto.tags != null) {
            if (dto.tags.isEmpty()) {
                ev.getTags().clear();
            } else {
                ev.setTags(service.resolveTags(dto.tags));
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
       DELETE (ADMIN)
    ===================== */

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @RequestParam String requesterEmail
    ) {
        User me = byEmail(requesterEmail);
        if (!isAdmin(me)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Admin only"));
        }

        Event event = events.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

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

        Integer myRating = null;
        if (user != null) {
            myRating = ratings
                    .findByEvent_IdAndUser_Id(id, user.getId())
                    .map(EventRating::getRating)
                    .orElse(null);
        }

        if (!canViewEvent(event, user)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Members only event"));
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

        if (event.getStatus() != Event.EventStatus.ENDED) {
            return ResponseEntity.status(409)
                    .body(Map.of("message", "Event not ended"));
        }

        int rating = body.getOrDefault("rating", 0);
        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Rating must be 1–5"));
        }

        if (!canViewEvent(event, user)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Members only event"));
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

    @GetMapping("/tag/{tagName}")
    public ResponseEntity<?> byTag(
            @PathVariable String tagName,
            @RequestParam(defaultValue = "all") String status
    ) {
        return ResponseEntity.ok(
                service.findByTag(tagName, normalizeStatus(status))
        );
    }

    @GetMapping("/club/{clubId}")
    public ResponseEntity<?> byClub(
            @PathVariable Long clubId,
            @RequestParam(defaultValue = "all") String status
    ) {
        return ResponseEntity.ok(
                service.findByClub(clubId, normalizeStatus(status))
        );
    }

    @PostMapping("/{id}/attendance-code/rotate")
    public ResponseEntity<?> rotateAttendanceCode(
            @PathVariable Long id,
            @RequestParam String requesterEmail
    ) {
        User me = byEmail(requesterEmail);
        if (me == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }


        Event ev = events.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!canViewEvent(ev, me)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Members only event"));
        }


        boolean isOwner = ev.getCreatedBy() != null
                && ev.getCreatedBy().getId().equals(me.getId());

        if (!isAdmin(me) && !isOwner) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Forbidden"));
        }

        String newCode = service.generateCode(8);
        ev.setAttendanceCodeHash(service.sha256Hex(newCode));
        events.save(ev);

        return ResponseEntity.ok(Map.of("attendanceCode", newCode));
    }

    private boolean canViewEvent(Event event, User user) {
        if (event.getVisibility() == EventVisibility.PUBLIC) {
            return true;
        }

        // CLUB_MEMBERS
        if (user == null || event.getClub() == null) {
            return false;
        }

        return event.getClub().getMembers().stream()
                .anyMatch(m -> m.getUserId().equals(user.getId()));
    }


}
