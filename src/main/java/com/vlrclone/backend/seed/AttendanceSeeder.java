package com.vlrclone.backend.seed;

import com.vlrclone.backend.Enums.Status;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventAttendance;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.EventAttendanceRepository;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Order(6)
@Component
public class AttendanceSeeder {

    private final EventAttendanceRepository attendanceRepo;
    private final EventRepository eventRepo;
    private final UserRepository userRepo;

    private final Random random = new Random();

    public AttendanceSeeder(
            EventAttendanceRepository attendanceRepo,
            EventRepository eventRepo,
            UserRepository userRepo
    ) {
        this.attendanceRepo = attendanceRepo;
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
    }

    public void seed() {

        if (attendanceRepo.count() > 0) return;

        List<Event> events = eventRepo.findAll();
        List<User> users = userRepo.findAll();

        if (events.isEmpty() || users.isEmpty()) return;

        for (Event event : events) {

            Collections.shuffle(users);

            // Determine attendance count based on event timing
            boolean isPast = event.getStartAt().isBefore(LocalDateTime.now());
            int attendeeCount;

            if (isPast) {
                attendeeCount = 10 + random.nextInt(15);
            } else {
                attendeeCount = 5 + random.nextInt(10);
            }

            for (int i = 0; i < Math.min(attendeeCount, users.size()); i++) {

                User user = users.get(i);

                EventAttendance attendance = new EventAttendance();
                attendance.setEvent(event);
                attendance.setUser(user);

                if (isPast) {
                    if (random.nextDouble() < 0.85) {
                        attendance.setStatus(Status.ATTENDED);
                    } else {
                        attendance.setStatus(Status.MISSED);
                    }
                } else {
                    double rand = random.nextDouble();
                    if (rand < 0.60) {
                        attendance.setStatus(Status.GOING);
                    } else if (rand < 0.85) {
                        attendance.setStatus(Status.MAYBE);
                    } else {
                        attendance.setStatus(Status.NOT_GOING);
                    }
                }

                attendanceRepo.save(attendance);
            }
        }
    }
}