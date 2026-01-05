package com.vlrclone.backend.service;

import com.vlrclone.backend.Enums.ClubCategory;
import com.vlrclone.backend.Enums.ClubSort;
import com.vlrclone.backend.model.Club;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.repository.ClubRepository;
import com.vlrclone.backend.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClubService {

    private final ClubRepository clubRepo;
    private final EventRepository eventRepo;

    public ClubService(ClubRepository clubRepo, EventRepository eventRepo) {
        this.clubRepo = clubRepo;
        this.eventRepo = eventRepo;
    }

    /* =========================
       READ (existing)
    ========================= */

    public List<Club> findAll() {
        return clubRepo.findAll();
    }

    public List<Club> findByCategory(ClubCategory category) {
        return clubRepo.findByCategory(category);
    }

    public Club findById(Long id) {
        return clubRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Club not found"));
    }

    /* =========================
       CREATE (existing)
    ========================= */

    public Club createClub(
            String name,
            String description,
            ClubCategory category
    ) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Club name required");
        }

        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Club description required");
        }

        if (category == null) {
            category = ClubCategory.OTHER;
        }

        Club club = new Club();
        club.setName(name.trim());
        club.setDescription(description.trim());
        club.setCategory(category);
        club.setCreatedAt(LocalDateTime.now());

        return clubRepo.save(club);
    }

    /**
     * Groups clubs by category and returns top N per category
     * sorted by member count (descending).
     */
    public Map<ClubCategory, List<Club>> topClubsByCategory(int limit) {

        List<Club> allClubs = clubRepo.findAll();

        return allClubs.stream()
                .filter(c -> c.getCategory() != null)
                .collect(Collectors.groupingBy(
                        Club::getCategory,
                        LinkedHashMap::new,
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> list.stream()
                                        .sorted((a, b) ->
                                                Integer.compare(
                                                        b.getMembers() == null ? 0 : b.getMembers().size(),
                                                        a.getMembers() == null ? 0 : a.getMembers().size()
                                                )
                                        )
                                        .limit(limit)
                                        .toList()
                        )
                ));
    }

    /* =========================
       SORTED CLUBS (existing)
    ========================= */

    public List<Club> findSorted(
            ClubCategory category,
            ClubSort sort
    ) {
        List<Club> clubs =
                (category == null)
                        ? clubRepo.findAll()
                        : clubRepo.findByCategory(category);

        Comparator<Club> comparator = resolveComparator(sort);

        return clubs.stream()
                .sorted(comparator)
                .toList();
    }

    private Comparator<Club> resolveComparator(ClubSort sort) {
        if (sort == null) {
            return Comparator.comparing(Club::getName, String.CASE_INSENSITIVE_ORDER);
        }

        return switch (sort) {
            case NAME_ASC ->
                    Comparator.comparing(Club::getName, String.CASE_INSENSITIVE_ORDER);

            case NAME_DESC ->
                    Comparator.comparing(Club::getName, String.CASE_INSENSITIVE_ORDER).reversed();

            case CREATED_NEW ->
                    Comparator.comparing(
                            Club::getCreatedAt,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    ).reversed();

            case CREATED_OLD ->
                    Comparator.comparing(
                            Club::getCreatedAt,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    );

            case MEMBERS_DESC ->
                    Comparator.comparingInt(
                            (Club c) -> c.getMembers() == null ? 0 : c.getMembers().size()
                    ).reversed();

            // If your enum does not include EVENTS_DESC yet, remove this case.
            case EVENTS_DESC ->
                    Comparator.comparingInt(
                            (Club c) -> 0
                    );
        };
    }

    /* =========================
       NEW: LIST WITH COUNTS (memberCount + eventCount)
       (No @Query. One clubs query + one events batch query.)
    ========================= */

    public List<ClubWithCounts> findAllWithCounts(ClubSort sort) {
        List<Club> clubs = clubRepo.findAll();
        return attachCountsAndSort(clubs, sort);
    }

    public List<ClubWithCounts> findByCategoryWithCounts(ClubCategory category, ClubSort sort) {
        List<Club> clubs = (category == null) ? clubRepo.findAll() : clubRepo.findByCategory(category);
        return attachCountsAndSort(clubs, sort);
    }

    private List<ClubWithCounts> attachCountsAndSort(List<Club> clubs, ClubSort sort) {
        if (clubs == null || clubs.isEmpty()) return List.of();

        List<Long> clubIds = clubs.stream()
                .map(Club::getId)
                .filter(Objects::nonNull)
                .toList();


        List<Event> allEventsForTheseClubs = eventRepo.findByClubIdIn(clubIds);

// Count events per clubId (via relationship)
        Map<Long, Long> eventCounts = allEventsForTheseClubs.stream()
                .filter(e -> e.getClub() != null)
                .collect(Collectors.groupingBy(
                        e -> e.getClub().getId(),
                        Collectors.counting()
                ));


        // Build rows
        List<ClubWithCounts> rows = clubs.stream()
                .map(c -> {
                    long memberCount = (c.getMembers() == null) ? 0 : c.getMembers().size();
                    long eventCount = eventCounts.getOrDefault(c.getId(), 0L);
                    return new ClubWithCounts(
                            c.getId(),
                            c.getName(),
                            c.getDescription(),
                            c.getCategory(),
                            c.getCreatedAt(),
                            c.getLogoUrl(),
                            memberCount,
                            eventCount
                    );
                })
                .toList();

        // Sort rows (including derived fields)
        List<ClubWithCounts> out = new ArrayList<>(rows);
        out.sort(resolveCountsComparator(sort));
        return out;
    }

    private Comparator<ClubWithCounts> resolveCountsComparator(ClubSort sort) {
        if (sort == null) {
            return Comparator.comparing(ClubWithCounts::name, String.CASE_INSENSITIVE_ORDER);
        }

        return switch (sort) {
            case NAME_ASC ->
                    Comparator.comparing(ClubWithCounts::name, String.CASE_INSENSITIVE_ORDER);

            case NAME_DESC ->
                    Comparator.comparing(ClubWithCounts::name, String.CASE_INSENSITIVE_ORDER).reversed();

            case CREATED_NEW ->
                    Comparator.comparing(
                            ClubWithCounts::createdAt,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    ).reversed();

            case CREATED_OLD ->
                    Comparator.comparing(
                            ClubWithCounts::createdAt,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    );

            case MEMBERS_DESC ->
                    Comparator.comparingLong(ClubWithCounts::memberCount).reversed();

            case EVENTS_DESC ->
                    Comparator.comparingLong(ClubWithCounts::eventCount).reversed();
        };
    }

    /* =========================
       NEW: DTO for list endpoints
    ========================= */
    public record ClubWithCounts(
            Long id,
            String name,
            String description,
            ClubCategory category,
            LocalDateTime createdAt,
            String logoUrl,
            long memberCount,
            long eventCount
    ) {}

    public Map<Long, Long> getEventCountsByClubIds(List<Long> clubIds) {
        if (clubIds == null || clubIds.isEmpty()) {
            return Map.of();
        }

        return eventRepo.findByClubIdIn(clubIds).stream()
                .filter(e -> e.getClub() != null)
                .collect(Collectors.groupingBy(
                        e -> e.getClub().getId(),
                        Collectors.counting()
                ));
    }

}
