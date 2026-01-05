// src/main/java/com/vlrclone/backend/controller/EventController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.Enums.Status;
import com.vlrclone.backend.dto.CommentDto;
import com.vlrclone.backend.dto.EventUpdateDto;
import com.vlrclone.backend.model.Comment;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventRating;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.*;
import com.vlrclone.backend.service.CurrentUserService;
import com.vlrclone.backend.service.EventService;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository events;
    private final UserRepository users;
    private final EventRatingRepository ratings;
    private final EventService service;
    private final ClubRepository clubs;
    private final CommentRepository commentRepository;
    private final EventAttendanceRepository eventAttendanceRepository;
    private final CurrentUserService currentUser;

    public EventController(
            EventRepository events,
            UserRepository users,
            EventRatingRepository ratings,
            EventService service,
            ClubRepository clubs,
            CommentRepository commentRepository, EventAttendanceRepository eventAttendanceRepository, CurrentUserService currentUser) {
        this.events = events;
        this.users = users;
        this.ratings = ratings;
        this.service = service;
        this.clubs = clubs;
        this.commentRepository = commentRepository;
        this.eventAttendanceRepository = eventAttendanceRepository;
        this.currentUser = currentUser;
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
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tags,
            @RequestParam(defaultValue = "all") String status
    ) {
        List<String> tagList = (tags == null || tags.isBlank())
                ? null
                : Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        return ResponseEntity.ok(
                service.searchEvents(q, tagList, normalizeStatus(status))
        );
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
        if (!isAdmin(me)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Admin only"));
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

        if (dto.clubId != null) {
            ev.setClub(
                    clubs.findById(dto.clubId)
                            .orElseThrow(() -> new IllegalArgumentException("Club not found"))
            );
        }

        if (dto.tags != null) {
            ev.setTags(service.resolveTags(dto.tags));
        }

        Event saved = events.save(ev);

        return ResponseEntity.ok(
                new EventUpdateDto(
                        events.findWithClubAndTagsById(saved.getId()).orElse(saved)
                )
        );
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

    @GetMapping("/{eventId}/comments")
    public List<CommentDto> getEventComments(@PathVariable Long eventId) {
        return commentRepository
                .findByEventIdAndParentIdIsNullOrderByCreatedAtDesc(eventId)
                .stream()
                .map(CommentDto::from)
                .toList();
    }
    @PostMapping("/{eventId}/comments")
    public CommentDto addEventComment(
            @PathVariable Long eventId,
            @RequestParam String requesterEmail,
            @RequestBody Map<String, String> body
    ) {

        User user = currentUser.requireUserByEmail(requesterEmail);

        // 🔒 Only GOING users can comment
        boolean attended = eventAttendanceRepository.existsByEventIdAndUserIdAndStatus(
                eventId, user.getId(), Status.GOING
        );

        if (!attended) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only attendees can comment");
        }

        Comment c = new Comment();
        c.setEventId(eventId);
        c.setUsername(user.getUsername());
        c.setComment(body.getOrDefault("comment", "").trim());

        if (c.getComment().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment required");
        }

        return CommentDto.from(commentRepository.save(c));
    }

    @DeleteMapping("/{eventId}/comments/{commentId}")
    public ResponseEntity<?> deleteEventComment(
            @PathVariable Long eventId,
            @PathVariable Long commentId,
            @RequestParam String requesterEmail
    ) {
        User requester = currentUser.requireUserByEmail(requesterEmail);

        Comment c = commentRepository.findById(commentId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!Objects.equals(c.getEventId(), eventId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }

        boolean isAdmin = requester.getRole() == User.Role.ADMIN;
        boolean isOwner = requester.getUsername().equals(c.getUsername());

        if (!isAdmin && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }

        commentRepository.delete(c);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }


}
