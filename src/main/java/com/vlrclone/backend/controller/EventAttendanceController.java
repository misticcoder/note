package com.vlrclone.backend.controller;

import com.vlrclone.backend.Enums.Status;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventAttendance;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.EventAttendanceRepository;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.UserRepository;
import com.vlrclone.backend.service.EventService;
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
    private final EventService eventService;

    public EventAttendanceController(
            EventRepository eventRepo,
            UserRepository userRepo,
            EventAttendanceRepository attendanceRepo, EventService eventService
    ) {
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
        this.attendanceRepo = attendanceRepo;
        this.eventService = eventService;
    }

    @PostMapping("/{eventId}/rsvp")
    public EventAttendance rsvp(
            @PathVariable Long eventId,
            @RequestParam String requesterEmail,
            @RequestParam Status status
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
        res.put("going", attendanceRepo.countByEventIdAndStatus(eventId, Status.GOING));
        res.put("maybe", attendanceRepo.countByEventIdAndStatus(eventId, Status.MAYBE));
        res.put("attended", attendanceRepo.countByEventIdAndStatus(eventId, Status.ATTENDED));
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
                .map(a -> Map.of("status", a.getStatus().name()))
                .orElse(Map.of());
    }

    @GetMapping("/{eventId}/attendees")
    public List<Map<String, Object>> attendees(
            @PathVariable Long eventId,
            @RequestParam Status status
    ) {
        if (!List.of(Status.GOING, Status.MAYBE, Status.ATTENDED).contains(status)) {
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

    @PostMapping("/{eventId}/check-in")
    public Map<String, Object> checkIn(
            @PathVariable Long eventId,
            @RequestParam String requesterEmail,
            @RequestParam String code
    ) {
        User user = userRepo.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        Event event = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (event.getAttendanceCodeHash() == null || event.getAttendanceCodeHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Attendance code not configured");
        }

        // hash provided code and compare
        String providedHash = eventService.sha256Hex(code.trim().toUpperCase());
        if (!providedHash.equals(event.getAttendanceCodeHash())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid code");
        }

        if (event.getStatus() != Event.EventStatus.LIVE) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Attendance only allowed during live events"
            );
        }


        EventAttendance attendance = attendanceRepo
                .findByEventIdAndUserId(eventId, user.getId())
                .orElseGet(() -> {
                    EventAttendance a = new EventAttendance();
                    a.setEvent(event);
                    a.setUser(user);
                    return a;
                });

        // Prevent re-awarding / re-counting
        boolean wasAlreadyAttended = attendance.getStatus() == Status.ATTENDED;

        attendance.setStatus(Status.ATTENDED);
        attendanceRepo.save(attendance);

        if (!wasAlreadyAttended) {
            user.setParticipationScore(user.getParticipationScore() + 1);
            userRepo.save(user);
        }

        return Map.of(
                "status", "ok",
                "attended", true,
                "participationScore", user.getParticipationScore()
        );
    }

    @GetMapping("/{eventId}/check-in")
    public Map<String, Object> checkInViaQr(
            @PathVariable Long eventId,
            @RequestParam String requesterEmail,
            @RequestParam String code
    ) {
        return checkIn(eventId, requesterEmail, code);
    }


}
