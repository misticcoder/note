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

import java.util.Collections;
import java.util.List;
import java.util.Random;

@Order(5)
@Component
public class AttendanceSeeder {

    private final EventRepository eventRepo;
    private final UserRepository userRepo;
    private final EventAttendanceRepository attendanceRepo;

    public AttendanceSeeder(
            EventRepository eventRepo,
            UserRepository userRepo,
            EventAttendanceRepository attendanceRepo
    ) {
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
        this.attendanceRepo = attendanceRepo;
    }

    public void seed() {

        if (attendanceRepo.count() > 0) return;

        List<Event> events = eventRepo.findAll();
        List<User> users = userRepo.findAll();

        Random random = new Random();

        for (Event event : events) {

            Collections.shuffle(users);

            for (int i = 0; i < Math.min(10, users.size()); i++) {

                EventAttendance attendance = new EventAttendance();
                attendance.setEvent(event);
                attendance.setUser(users.get(i));
                Status[] statuses = Status.values();

                attendance.setStatus(
                        statuses[random.nextInt(statuses.length)]
                );

                attendanceRepo.save(attendance);
            }
        }
    }
}
