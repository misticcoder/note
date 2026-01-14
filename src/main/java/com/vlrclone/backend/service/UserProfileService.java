package com.vlrclone.backend.service;

import com.vlrclone.backend.Enums.ClubSort;
import com.vlrclone.backend.Enums.Status;
import com.vlrclone.backend.dto.UpdateProfileDto;
import com.vlrclone.backend.dto.UserClubDto;
import com.vlrclone.backend.dto.UserEventDto;
import com.vlrclone.backend.dto.UserProfileDto;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventAttendance;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.ClubMemberRepository;
import com.vlrclone.backend.repository.EventAttendanceRepository;
import com.vlrclone.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserProfileService {

    private final UserRepository userRepository;
    private final EventAttendanceRepository attendanceRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ClubService clubService;

    public UserProfileService(UserRepository userRepository,
                              EventAttendanceRepository attendanceRepository, ClubMemberRepository clubMemberRepository, ClubService clubService) {
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
        this.clubMemberRepository = clubMemberRepository;
        this.clubService = clubService;
    }

    public UserProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        int attended = (int) attendanceRepository
                .countByUserIdAndStatus(userId, Status.ATTENDED);

        int going = (int) attendanceRepository
                .countByUserIdAndStatus(userId, Status.GOING);

        int maybe = (int) attendanceRepository
                .countByUserIdAndStatus(userId, Status.MAYBE);

        int joined = attended + going + maybe;

        int missed = attendanceRepository
                .findByUserIdAndStatusIn(userId, List.of(Status.GOING, Status.MAYBE))
                .stream()
                .filter(a ->
                        a.getEvent().getEndAt() != null &&
                                a.getEvent().getEndAt().isBefore(LocalDateTime.now())
                )
                .toList()
                .size();



        int score = computeScore(joined, going, attended);

        UserProfileDto dto = new UserProfileDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.role = user.getRole();
        dto.displayName = resolveDisplayName(user);
        dto.bio = user.getBio();
        dto.avatarUrl = user.getAvatarUrl();
        dto.eventsJoined = joined;
        dto.eventsAttended = attended;
        dto.eventsMissed = missed;
        dto.participationScore = score;

        return dto;
    }

    private int computeScore(int joined, int going, int attended) {
        return (joined * 2) + (going * 5) + (attended * 10);
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
                        List.of(Status.ATTENDED, Status.GOING, Status.MAYBE)
                );

        var now = java.time.LocalDateTime.now();

        return attendances.stream()
                .map(a -> {
                    Event e = a.getEvent();

                    String finalStatus = a.getStatus().name();

                    // 🔑 MISSED logic
                    if (
                            (a.getStatus() == Status.GOING || a.getStatus() == Status.MAYBE)
                                    && e.getEndAt() != null
                                    && e.getEndAt().isBefore(now)
                    ) {
                        finalStatus = Status.MISSED.name();
                    }

                    UserEventDto dto = new UserEventDto();
                    dto.id = e.getId();
                    dto.title = e.getTitle();
                    dto.location = e.getLocation();
                    dto.startAt = e.getStartAt();
                    dto.endAt = e.getEndAt();
                    dto.status = finalStatus;
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


    @Transactional
    public UserProfileDto updateProfile(Long userId, UpdateProfileDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow();

        if (dto.displayName != null) {
            user.setDisplayName(dto.displayName.trim());
        }

        if (dto.bio != null) {
            user.setBio(dto.bio.trim());
        }

        if (dto.avatarUrl != null) {
            user.setAvatarUrl(dto.avatarUrl.trim());
        }

        userRepository.save(user);

        return getProfile(userId);
    }

    public List<UserClubDto> getUserClubs(Long userId) {

        var memberships = clubMemberRepository.findByUserId(userId);

        if (memberships.isEmpty()) {
            return List.of();
        }

        // 1️⃣ Collect club IDs
        List<Long> clubIds = memberships.stream()
                .map(m -> m.getClub().getId())
                .toList();

        // 2️⃣ Fetch event counts ONCE
        var eventCounts = clubService.getEventCountsByClubIds(clubIds);

        // 3️⃣ Build DTOs
        return memberships.stream()
                .map(m -> {
                    var club = m.getClub();

                    UserClubDto dto = new UserClubDto();
                    dto.id = club.getId();
                    dto.name = club.getName();
                    dto.logoUrl = club.getLogoUrl();
                    dto.category = club.getCategory();
                    dto.role = m.getRole().name();

                    // safe counts
                    dto.memberCount = club.getMembers() == null
                            ? 0
                            : club.getMembers().size();

                    dto.eventCount = Math.toIntExact(eventCounts.getOrDefault(club.getId(), 0L));

                    return dto;
                })
                .toList();
    }


}
