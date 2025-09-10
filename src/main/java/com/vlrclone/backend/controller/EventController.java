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
                .orElse(ResponseEntity.status(404).body(Map.of("message","Event not found")));
    }

    // Admin: create
    @PostMapping
    public ResponseEntity<?> create(@RequestParam String requesterEmail,
                                    @RequestBody Map<String, String> body) {
        var me = byEmail(requesterEmail);
        if (!isAdmin(me)) return ResponseEntity.status(403).body(Map.of("message","Admin only"));

        var name = (body.getOrDefault("name","")+"").trim();
        var description = body.getOrDefault("description","");
        var location = body.getOrDefault("location","");
        var startStr = body.getOrDefault("startAt","");
        var endStr = body.getOrDefault("endAt","");

        if (name.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message","name and startAt are required"));

        var ev = new Event();
        ev.setTitle(name);
        ev.setContent(description);
        ev.setLocation(location);
        ev.setStartAt(LocalDateTime.parse(startStr)); // expects ISO-8601 (e.g., 2025-09-01T18:00:00)
        if (!endStr.isBlank()) ev.setEndAt(LocalDateTime.parse(endStr));

        return ResponseEntity.ok(events.save(ev));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") Long clubId,
                                    @RequestBody Map<String, Object> body) {
        var opt = events.findById(clubId);
        if (opt.isEmpty()) { return ResponseEntity.status(404).body(Map.of("message", "Event not found"));}
        var c = opt.get();
        if (body.containsKey("title")) { c.setTitle(String.valueOf(body.get("name"))); }
        if (body.containsKey("content")) { c.setContent(String.valueOf(body.get("content")));}
        if (body.containsKey("location")) { c.setLocation(String.valueOf(body.get("location")));}
        if (body.containsKey("startAt")) {c.setStartAt(LocalDateTime.parse(String.valueOf(body.get("startAt"))));}
        if (body.containsKey("endAt")) {c.setEndAt(LocalDateTime.parse(String.valueOf(body.get("endAt"))));}
        var saved = events.save(c);
        // Return the updated club (or a simple JSON map if you prefer)
        return ResponseEntity.ok(saved);
    }

    // Admin: delete
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, @RequestParam String requesterEmail) {
        var me = byEmail(requesterEmail);
        if (!isAdmin(me)) return ResponseEntity.status(403).body(Map.of("message","Admin only"));
        if (!events.existsById(id)) return ResponseEntity.status(404).body(Map.of("message","Event not found"));
        events.deleteById(id);
        return ResponseEntity.ok(Map.of("status","deleted","id", id));
    }
}
