package com.vlrclone.backend.service;

import com.vlrclone.backend.dto.SearchResponseDto;
import com.vlrclone.backend.dto.SearchResultDto;
import com.vlrclone.backend.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SearchService {

    private final EventRepository eventRepo;
    private final ClubRepository clubRepo;
    private final ThreadRepository threadRepo;
    private final PostRepository postRepo;
    private final TagRepository tagRepo;

    public SearchService(
            EventRepository eventRepo,
            ClubRepository clubRepo,
            ThreadRepository threadRepo,
            PostRepository postRepo,
            TagRepository tagRepo
    ) {
        this.eventRepo = eventRepo;
        this.clubRepo = clubRepo;
        this.threadRepo = threadRepo;
        this.postRepo = postRepo;
        this.tagRepo = tagRepo;
    }

    /* ======================================================
       FILTERED SEARCH (HYBRID TAG + TEXT SEARCH)
       ====================================================== */

    public SearchResponseDto search(String q) {

        if (q == null) q = "";
        q = q.trim();

        boolean isTagQuery = q.startsWith("#");
        String cleanQuery = isTagQuery ? q.substring(1).trim() : q;

        var limit = PageRequest.of(0, 6);
        var dateFmt = DateTimeFormatter.ofPattern("MMM d");

        /* ===============================
           1. TAG-BOOSTED EVENTS
           =============================== */

        List<SearchResultDto> boostedEvents = tagRepo
                .findByNameIgnoreCase(cleanQuery)
                .map(tag -> eventRepo
                        .findByTags_NameIgnoreCaseOrderByStartAtAsc(cleanQuery)
                        .stream()
                        .map(e -> new SearchResultDto(
                                e.getId(),
                                e.getTitle(),
                                buildEventSubtitle(e.getStatus().name(), e.getStartAt(), dateFmt),
                                e.getStatus().name().toLowerCase(),
                                "#/events/" + e.getId()
                        ))
                        .toList()
                )
                .orElse(List.of());

        /* ===============================
           2. NORMAL EVENT SEARCH
           =============================== */

        List<SearchResultDto> normalEvents = eventRepo
                .findByTitleContainingIgnoreCaseOrderByStartAtDesc(cleanQuery, limit)
                .stream()
                .map(e -> new SearchResultDto(
                        e.getId(),
                        e.getTitle(),
                        buildEventSubtitle(e.getStatus().name(), e.getStartAt(), dateFmt),
                        e.getStatus().name().toLowerCase(),
                        "#/events/" + e.getId()
                ))
                .toList();

        /* ===============================
           3. MERGE + DEDUPE (TAG FIRST)
           =============================== */

        Map<Long, SearchResultDto> eventMap = new LinkedHashMap<>();

        boostedEvents.forEach(e -> eventMap.put(e.getId(), e));

        for (var e : normalEvents) {
            if (eventMap.size() >= 6) break;
            eventMap.putIfAbsent(e.getId(), e);
        }

        List<SearchResultDto> events = List.copyOf(eventMap.values());

        /* ===============================
           4. OTHER ENTITIES (TEXT SEARCH)
           =============================== */

        var clubs = clubRepo
                .findByNameContainingIgnoreCase(cleanQuery, limit)
                .stream()
                .map(c -> new SearchResultDto(
                        c.getId(),
                        c.getName(),
                        c.getCategory().name(),
                        null,
                        "#/clubs/" + c.getId()
                ))
                .toList();

        var threads = threadRepo
                .findByTitleContainingIgnoreCase(cleanQuery, limit)
                .stream()
                .map(t -> new SearchResultDto(
                        t.getId(),
                        t.getTitle(),
                        "Thread",
                        null,
                        "#/threads/" + t.getId()
                ))
                .toList();

        var posts = postRepo
                .findByContentContainingIgnoreCase(cleanQuery, limit)
                .stream()
                .map(p -> new SearchResultDto(
                        p.getId(),
                        truncate(p.getContent(), 60),
                        "By " + p.getAuthor(),
                        null,
                        "#/posts/" + p.getId()
                ))
                .toList();

        // ❗ No tag rows returned in search
        return new SearchResponseDto(
                events,
                clubs,
                threads,
                posts,
                List.of()
        );
    }

    /* ======================================================
       DEFAULT RESULTS (DISCOVERY MODE)
       ====================================================== */

    public SearchResponseDto defaultResults() {

        var limit = PageRequest.of(0, 6);
        var now = LocalDateTime.now();
        var dateFmt = DateTimeFormatter.ofPattern("MMM d");

        var events = eventRepo
                .findByStartAtAfterOrderByStartAtAsc(now, limit)
                .stream()
                .map(e -> new SearchResultDto(
                        e.getId(),
                        e.getTitle(),
                        "Upcoming · " + e.getStartAt().format(dateFmt),
                        "upcoming",
                        "#/events/" + e.getId()
                ))
                .toList();

        var clubs = clubRepo
                .findAllByOrderByCreatedAtDesc(limit)
                .stream()
                .map(c -> new SearchResultDto(
                        c.getId(),
                        c.getName(),
                        c.getCategory().name(),
                        null,
                        "#/clubs/" + c.getId()
                ))
                .toList();

        var threads = threadRepo
                .findAllByOrderByPublishedDesc(limit)
                .stream()
                .map(t -> new SearchResultDto(
                        t.getId(),
                        t.getTitle(),
                        "Recently active",
                        null,
                        "#/threads/" + t.getId()
                ))
                .toList();

        var posts = postRepo
                .findAllByOrderByCreatedAtDesc(limit)
                .stream()
                .map(p -> new SearchResultDto(
                        p.getId(),
                        truncate(p.getContent(), 60),
                        "By " + p.getAuthor(),
                        null,
                        "#/posts/" + p.getId()
                ))
                .toList();

        var tags = tagRepo
                .findAllByOrderByNameAsc(limit)
                .stream()
                .map(t -> new SearchResultDto(
                        t.getId(),
                        "#" + t.getName(),
                        "Tag",
                        null,
                        "#/tags/" + t.getName()
                ))
                .toList();

        return new SearchResponseDto(events, clubs, threads, posts, tags);
    }

    /* ======================================================
       UTIL
       ====================================================== */

    private String truncate(String text, int len) {
        if (text == null) return "";
        return text.length() <= len ? text : text.substring(0, len) + "…";
    }

    private String buildEventSubtitle(String status, LocalDateTime startAt, DateTimeFormatter fmt) {
        if (startAt == null) return status;
        return status + " · " + startAt.format(fmt);
    }
}
