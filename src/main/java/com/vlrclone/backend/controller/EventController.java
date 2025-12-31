// src/main/java/com/vlrclone/backend/controller/EventController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.dto.EventUpdateDto;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventRating;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.EventRatingRepository;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.TagRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.vlrclone.backend.service.EventService;


import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository events;
    private final UserRepository users;
    private final EventRatingRepository eventRatings;
    private final EventService eventService;
    private final TagRepository tags;


    public EventController(EventRepository events, UserRepository users, EventRatingRepository eventRatings, EventService eventService, TagRepository tags) {
        this.events = events;
        this.users = users;
        this.eventRatings = eventRatings;
        this.eventService = eventService;
        this.tags = tags;
    }

    private boolean isAdmin(User u) {
        return u != null && u.getRole() == User.Role.ADMIN;
    }

    private User byEmail(String email) {
        return email == null ? null : users.findByEmail(email).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(defaultValue = "upcoming") String status
    ) {
        return ResponseEntity.ok(
                eventService.searchEvents(q, tags, status)
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return events.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404)
                        .body(Map.of("message", "Event not found")));
    }

    // ---------------- CREATE ----------------
    @PostMapping
    public ResponseEntity<?> create(
            @RequestParam String requesterEmail,
            @RequestBody EventUpdateDto dto
    ) {
        var me = byEmail(requesterEmail);
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
        ev.setContent(dto.content != null ? dto.content.trim() : null);
        ev.setLocation(dto.location != null && !dto.location.isBlank()
                ? dto.location.trim()
                : null);
        ev.setStartAt(dto.startAt);
        ev.setEndAt(dto.endAt);

        if (dto.tags != null && !dto.tags.isEmpty()) {
            ev.setTags(eventService.resolveTags(dto.tags));
        }

        return ResponseEntity.ok(events.save(ev));
    }


    // ---------------- UPDATE ----------------
    @PatchMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestParam String requesterEmail,
            @RequestBody EventUpdateDto dto
    ) {
        var me = byEmail(requesterEmail);
        if (!isAdmin(me)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Admin only"));
        }

        var opt = events.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Event not found"));
        }

        var ev = opt.get();

        if (ev.getStatus() == Event.EventStatus.ENDED) {
            return ResponseEntity.status(409)
                    .body(Map.of("message", "Ended events cannot be modified"));
        }

        if (dto.title != null) ev.setTitle(dto.title.trim());
        if (dto.content != null) ev.setContent(dto.content.trim());

        if (dto.location != null) {
            ev.setLocation(dto.location.isBlank() ? null : dto.location.trim());
        }

        if (dto.startAt != null) ev.setStartAt(dto.startAt);
        if (dto.endAt != null) ev.setEndAt(dto.endAt);

        if (dto.tags != null) {
            if (dto.tags.isEmpty()) {
                ev.getTags().clear();   // <-- THIS enables clearing all tags
            } else {
                ev.setTags(eventService.resolveTags(dto.tags));
            }
        }



        return ResponseEntity.ok(events.save(ev));
    }


    // ---------------- DELETE ----------------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @RequestParam String requesterEmail
    ) {
        var me = byEmail(requesterEmail);
        if (!isAdmin(me)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Admin only"));
        }

        var opt = events.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Event not found"));
        }

        events.delete(opt.get());
        return ResponseEntity.ok(Map.of("status", "deleted", "id", id));
    }

    @GetMapping("/{id}/rating")
    public ResponseEntity<?> getRating(
            @PathVariable Long id,
            @RequestParam(required = false) String requesterEmail
    ) {
        User user = requesterEmail != null ? byEmail(requesterEmail) : null;

        List<EventRating> ratings = eventRatings.findByEvent_Id(id);

        double average = ratings.isEmpty()
                ? 0.0
                : ratings.stream()
                .mapToInt(EventRating::getRating)
                .average()
                .orElse(0.0);

        int count = ratings.size();

        Integer myRating = null;
        if (user != null) {
            myRating = eventRatings
                    .findByEvent_IdAndUser_Id(id, user.getId())
                    .map(EventRating::getRating)
                    .orElse(null);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("average", average);
        response.put("count", count);
        response.put("myRating", myRating); // null is allowed here

        return ResponseEntity.ok(response);

    }

    @PostMapping("/{id}/rating")
    public ResponseEntity<?> rateEvent(
            @PathVariable Long id,
            @RequestParam String requesterEmail,
            @RequestBody Map<String, Integer> body
    ) {
        User user = byEmail(requesterEmail);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "User not found"));
        }

        Event event = events.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Event not found"));
        }


        if (event.getStatus() != Event.EventStatus.ENDED) {
            return ResponseEntity.status(409)
                    .body(Map.of("message", "Event not ended"));
        }

        int rating = body.getOrDefault("rating", 0);
        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Rating must be 1–5"));
        }

        EventRating er = eventRatings
                .findByEvent_IdAndUser_Id(id, user.getId())
                .orElseGet(EventRating::new);

        er.setEvent(event);
        er.setUser(user);
        er.setRating(rating);
        if (er.getId() == null) {
            er.setCreatedAt(LocalDateTime.now());
        }
        er.setUpdatedAt(LocalDateTime.now());


        eventRatings.save(er);

        return getRating(id, requesterEmail);

    }


}
