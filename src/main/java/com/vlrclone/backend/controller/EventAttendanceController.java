package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventAttendance;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.EventAttendanceRepository;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventAttendanceController {

    private final EventRepository eventRepo;
    private final UserRepository userRepo;
    private final EventAttendanceRepository attendanceRepo;

    public EventAttendanceController(
            EventRepository eventRepo,
            UserRepository userRepo,
            EventAttendanceRepository attendanceRepo
    ) {
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
        this.attendanceRepo = attendanceRepo;
    }

    @PostMapping("/{eventId}/rsvp")
    public EventAttendance rsvp(
            @PathVariable Long eventId,
            @RequestParam String requesterEmail,
            @RequestParam String status
    ) {
        User user = userRepo.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        EventAttendance attendance = attendanceRepo
                .findByEventIdAndUserId(eventId, user.getId())
                .orElseGet(() -> {
                    EventAttendance a = new EventAttendance();
                    a.setEvent(event);
                    a.setUser(user);
                    return a;
                });

        attendance.setStatus(status);
        return attendanceRepo.save(attendance);
    }

    @GetMapping("/{eventId}/attendance")
    public Map<String, Object> attendance(@PathVariable Long eventId) {
        Map<String, Object> res = new HashMap<>();
        res.put("going", attendanceRepo.countByEventIdAndStatus(eventId, "GOING"));
        res.put("maybe", attendanceRepo.countByEventIdAndStatus(eventId, "MAYBE"));
        return res;
    }

    @DeleteMapping("/{eventId}/rsvp")
    public void cancelRsvp(
            @PathVariable Long eventId,
            @RequestParam String requesterEmail
    ) {
        User user = userRepo.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        EventAttendance attendance = attendanceRepo
                .findByEventIdAndUserId(eventId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        attendanceRepo.delete(attendance);
    }

    @GetMapping("/{eventId}/rsvp")
    public Map<String, String> getMyRsvp(
            @PathVariable Long eventId,
            @RequestParam String requesterEmail
    ) {
        User user = userRepo.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        return attendanceRepo.findByEventIdAndUserId(eventId, user.getId())
                .map(a -> Map.of("status", a.getStatus()))
                .orElse(Map.of());
    }

    @GetMapping("/{eventId}/attendees")
    public List<Map<String, Object>> attendees(
            @PathVariable Long eventId,
            @RequestParam String status
    ) {
        if (!List.of("GOING", "MAYBE").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        }

        return attendanceRepo.findByEventIdAndStatus(eventId, status)
                .stream()
                .map(a -> {
                    User u = a.getUser();
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    return m;
                })
                .toList();
    }
}
