package com.vlrclone.backend.service;

import com.vlrclone.backend.Enums.Status;
import com.vlrclone.backend.dto.UserEventDto;
import com.vlrclone.backend.dto.UserProfileDto;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventAttendance;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.EventAttendanceRepository;
import com.vlrclone.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserProfileService {

    private final UserRepository userRepository;
    private final EventAttendanceRepository attendanceRepository;

    public UserProfileService(UserRepository userRepository,
                              EventAttendanceRepository attendanceRepository) {
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
    }

    public UserProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        int going = (int) attendanceRepository
                .countByUserIdAndStatus(userId, Status.GOING);

        int maybe = (int) attendanceRepository
                .countByUserIdAndStatus(userId, Status.MAYBE);

        int joined = going + maybe;

        int score = computeScore(joined, going);

        UserProfileDto dto = new UserProfileDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.role = user.getRole();
        dto.displayName = resolveDisplayName(user);
        dto.bio = user.getBio();
        dto.avatarUrl = user.getAvatarUrl();
        dto.eventsJoined = joined;
        dto.eventsAttended = going; // “Going” is closest to actual attendance
        dto.participationScore = score;

        return dto;
    }

    private int computeScore(int joined, int going) {
        return (joined * 5) + (going * 10);
    }

    private String resolveDisplayName(User user) {
        return (user.getDisplayName() != null && !user.getDisplayName().isBlank())
                ? user.getDisplayName()
                : user.getUsername();
    }

    @Transactional(readOnly = true)
    public List<UserEventDto> getUserEvents(Long userId) {

        List<EventAttendance> attendances =
                attendanceRepository.findByUserIdAndStatusIn(
                        userId,
                        List.of(Status.GOING, Status.MAYBE)
                );

        return attendances.stream()
                .map(a -> {
                    Event e = a.getEvent();

                    UserEventDto dto = new UserEventDto();
                    dto.id = e.getId();
                    dto.title = e.getTitle();
                    dto.location = e.getLocation();
                    dto.startAt = e.getStartAt();
                    dto.endAt = e.getEndAt();
                    dto.status = a.getStatus().name();
                    dto.clubName = e.getClub() != null
                            ? e.getClub().getName()
                            : null;

                    return dto;
                })
                .sorted((a, b) -> {
                    if (a.startAt == null) return 1;
                    if (b.startAt == null) return -1;
                    return a.startAt.compareTo(b.startAt);
                })
                .toList();
    }

}
