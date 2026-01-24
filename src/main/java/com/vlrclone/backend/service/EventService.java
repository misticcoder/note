// src/main/java/com/vlrclone/backend/service/EventService.java
package com.vlrclone.backend.service;

import com.vlrclone.backend.dto.EventUpdateDto;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.EventRating;
import com.vlrclone.backend.model.Tag;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.EventRatingRepository;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.TagRepository;
import com.vlrclone.backend.repository.spec.EventSpecifications;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventService {

    private final EventRepository eventRepo;
    private final TagRepository tagRepo;
    private final EventRatingRepository ratingRepo;

    public EventService(
            EventRepository eventRepo,
            TagRepository tagRepo,
            EventRatingRepository ratingRepo
    ) {
        this.eventRepo = eventRepo;
        this.tagRepo = tagRepo;
        this.ratingRepo = ratingRepo;
    }

    /* =========================
       SEARCH / LIST EVENTS
       (used by GET /api/events)
    ========================= */

    @Transactional(propagation = Propagation.SUPPORTS, readOnly = true)
    public List<EventUpdateDto> searchEvents(
            String q,
            List<String> tags,
            String status
    ) {
        Specification<Event> spec = Specification
                .where(EventSpecifications.searchText(q))
                .and(EventSpecifications.hasTags(tags));

        if (status != null && !"ALL".equalsIgnoreCase(status)) {
            spec = spec.and(
                    EventSpecifications.hasStatus(status, LocalDateTime.now())
            );
        }

        return eventRepo.findAll(
                        spec,
                        Sort.by(Sort.Direction.ASC, "startAt")
                )
                .stream()
                .map(EventUpdateDto::new)
                .toList();
    }

    /* =========================
       TAG RESOLUTION
       (used by CREATE / UPDATE)
    ========================= */

    public Set<Tag> resolveTags(Collection<String> names) {
        if (names == null || names.isEmpty()) {
            return new HashSet<>();
        }

        return names.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(String::toLowerCase)
                .distinct()
                .limit(10)
                .map(name ->
                        tagRepo.findByNameIgnoreCase(name)
                                .orElseGet(() -> tagRepo.save(new Tag(name)))
                )
                .collect(Collectors.toSet());
    }

    /* =========================
       FILTER BY TAG
       (GET /api/events/tag/{tag})
    ========================= */

    @Transactional(propagation = Propagation.SUPPORTS, readOnly = true)
    public List<EventUpdateDto> findByTag(String tagName, String status) {
        Tag tag = tagRepo.findByNameIgnoreCase(tagName)
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        List<Event> events = eventRepo.findByTagsContaining(tag);
        return filterByStatus(events, status);
    }

    /* =========================
       FILTER BY CLUB
       (GET /api/events/club/{id})
    ========================= */

    @Transactional(propagation = Propagation.SUPPORTS, readOnly = true)
    public List<EventUpdateDto> findByClub(Long clubId, String status) {
        List<Event> events = eventRepo.findByClubId(clubId);
        return filterByStatus(events, status);
    }

    /* =========================
       STATUS FILTER (IN-MEMORY)
    ========================= */

    private List<EventUpdateDto> filterByStatus(
            List<Event> events,
            String status
    ) {
        if (status == null || "ALL".equalsIgnoreCase(status)) {
            return events.stream().map(EventUpdateDto::new).toList();
        }

        LocalDateTime now = LocalDateTime.now();

        return events.stream()
                .filter(ev -> {
                    LocalDateTime start = ev.getStartAt();
                    LocalDateTime end = ev.getEndAt() != null
                            ? ev.getEndAt()
                            : (start != null ? start.plusHours(2) : null);

                    return switch (status.toUpperCase()) {
                        case "UPCOMING" ->
                                start != null && now.isBefore(start);
                        case "LIVE" ->
                                start != null && end != null &&
                                        !now.isBefore(start) &&
                                        now.isBefore(end);
                        case "ENDED" ->
                                end != null && now.isAfter(end);
                        default -> true;
                    };
                })
                .map(EventUpdateDto::new)
                .toList();
    }

    /* =========================
       RATINGS (WRITE)
    ========================= */

    public void saveOrUpdateRating(Event event, User user, int value) {
        EventRating rating = ratingRepo
                .findByEventAndUser(event, user)
                .orElseGet(() -> {
                    EventRating r = new EventRating();
                    r.setEvent(event);
                    r.setUser(user);
                    return r;
                });

        rating.setRating(value);
        ratingRepo.save(rating);

        recalculateEventRating(event);
    }

    public void deleteRating(Event event, User user) {
        if (ratingRepo.findByEventAndUser(event, user).isPresent()) {
            ratingRepo.deleteByEventAndUser(event, user);
            recalculateEventRating(event);
        }
    }

    /* =========================
       RATING AGGREGATION
       (average + count)
    ========================= */

    private void recalculateEventRating(Event event) {
        List<EventRating> ratings = ratingRepo.findAllByEvent(event);

        int count = ratings.size();
        double avg = ratings.isEmpty()
                ? 0.0
                : ratings.stream()
                .mapToInt(EventRating::getRating)
                .average()
                .orElse(0.0);

        event.setRatingCount(count);
        event.setAverageRating(avg);

        eventRepo.save(event);
    }

    /* =========================
       SINGLE "MY RATING"
       (used by controller GET /{id})
    ========================= */

    @Transactional(propagation = Propagation.SUPPORTS, readOnly = true)

    public Integer getMyRating(Event event, User user) {
        if (user == null) return null;

        return ratingRepo
                .findByEventAndUser(event, user)
                .map(EventRating::getRating)
                .orElse(null);
    }

    private static final SecureRandom RNG = new SecureRandom();
    private static final char[] ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    public String generateCode(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) sb.append(ALPHANUM[RNG.nextInt(ALPHANUM.length)]);
        return sb.toString();
    }

    public String sha256Hex(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Hashing failed", e);
        }
    }

    public List<Event> getEventsByTag(String tag) {
        if (tag == null || tag.isBlank()) {
            return eventRepo.findByStartAtAfter(LocalDateTime.now());
        }

        return eventRepo.findByTags_NameIgnoreCaseAndStartAtAfter(
                tag.trim(),
                LocalDateTime.now()
        );
    }

    @Transactional(readOnly = true)
    public List<EventUpdateDto> getRecommendedEventsForUser(User user) {

        if (user == null || user.getTags().isEmpty()) {
            return List.of();
        }

        Set<String> userTagNames = user.getTags().stream()
                .map(t -> t.getName().toLowerCase())
                .collect(Collectors.toSet());

        LocalDateTime now = LocalDateTime.now();

        return eventRepo.findByStartAtAfter(now)
                .stream()
                .map(e -> {
                    long matches = e.getTags().stream()
                            .map(t -> t.getName().toLowerCase())
                            .filter(userTagNames::contains)
                            .count();
                    return new AbstractMap.SimpleEntry<>(e, matches);
                })
                .filter(entry -> entry.getValue() > 0)
                .sorted((a, b) -> {
                    int byMatches = Long.compare(b.getValue(), a.getValue());
                    if (byMatches != 0) return byMatches;
                    return a.getKey().getStartAt().compareTo(b.getKey().getStartAt());
                })
                .map(entry -> new EventUpdateDto(entry.getKey()))
                .toList();
    }


}
