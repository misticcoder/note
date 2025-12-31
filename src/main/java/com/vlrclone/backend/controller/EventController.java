// src/main/java/com/vlrclone/backend/controller/EventController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventRating;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.EventRatingRepository;
import com.vlrclone.backend.repository.EventRepository;
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


    public EventController(EventRepository events, UserRepository users, EventRatingRepository eventRatings, EventService eventService) {
        this.events = events;
        this.users = users;
        this.eventRatings = eventRatings;
        this.eventService = eventService;
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
            @RequestBody Map<String, String> body
    ) {
        var me = byEmail(requesterEmail);
        if (!isAdmin(me)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Admin only"));
        }

        var title = body.getOrDefault("title", "").trim();
        var content = body.getOrDefault("content", "").trim();
        var location = body.getOrDefault("location", "").trim();
        var startStr = body.get("startAt");
        var endStr = body.get("endAt");

        if (title.isBlank() || startStr == null || startStr.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "title and startAt are required"));
        }


        LocalDateTime startAt;
        LocalDateTime endAt = null;

        try {
            startAt = LocalDateTime.parse(startStr);
            if (endStr != null && !endStr.isBlank()) {
                endAt = LocalDateTime.parse(endStr);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid date format. Use ISO-8601."));
        }

        var ev = new Event();
        ev.setTitle(title);
        ev.setContent(content);
        ev.setLocation(location.isBlank() ? null : location);
        ev.setStartAt(startAt);
        ev.setEndAt(endAt);

        return ResponseEntity.ok(events.save(ev));
    }

    // ---------------- UPDATE ----------------
    @PatchMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestParam String requesterEmail,
            @RequestBody Map<String, Object> body
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

        try {
            if (body.containsKey("title")) {
                ev.setTitle(String.valueOf(body.get("title")).trim());
            }
            if (body.containsKey("content")) {
                ev.setContent(String.valueOf(body.get("content")).trim());
            }
            if (body.containsKey("location")) {
                var loc = String.valueOf(body.get("location")).trim();
                ev.setLocation(loc.isBlank() ? null : loc);
            }
            if (body.containsKey("startAt")) {
                ev.setStartAt(LocalDateTime.parse(String.valueOf(body.get("startAt"))));
            }
            if (body.containsKey("endAt")) {
                var end = String.valueOf(body.get("endAt"));
                ev.setEndAt(end == null || end.isBlank()
                        ? null
                        : LocalDateTime.parse(end));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid date format. Use ISO-8601."));
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
