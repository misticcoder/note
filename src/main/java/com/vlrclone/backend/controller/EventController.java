// src/main/java/com/vlrclone/backend/controller/EventController.java
package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository events;
    private final UserRepository users;

    public EventController(EventRepository events, UserRepository users) {
        this.events = events;
        this.users = users;
    }

    private boolean isAdmin(User u) {
        return u != null && u.getRole() == User.Role.ADMIN;
    }

    private User byEmail(String email) {
        return email == null ? null : users.findByEmail(email).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(events.findAll());
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

}
