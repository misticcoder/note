package com.vlrclone.backend.service;

import com.vlrclone.backend.dto.SearchResponseDto;
import com.vlrclone.backend.dto.SearchResultDto;
import com.vlrclone.backend.model.*;
import com.vlrclone.backend.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class SearchService {

    private final EventRepository eventRepo;
    private final ClubRepository clubRepo;
    private final ThreadRepository threadRepo;
    private final PostRepository postRepo;

    public SearchService(
            EventRepository eventRepo,
            ClubRepository clubRepo,
            ThreadRepository threadRepo,
            PostRepository postRepo
    ) {
        this.eventRepo = eventRepo;
        this.clubRepo = clubRepo;
        this.threadRepo = threadRepo;
        this.postRepo = postRepo;
    }

    /* ======================================================
       FILTERED SEARCH (WITH QUERY)
       ====================================================== */

    public SearchResponseDto search(String q) {

        var limit = PageRequest.of(0, 6);
        var dateFmt = DateTimeFormatter.ofPattern("MMM d");

        List<SearchResultDto> events = eventRepo
                .findByTitleContainingIgnoreCaseOrderByStartAtDesc(q, limit)
                .stream()
                .map(e -> new SearchResultDto(
                        e.getId(),
                        e.getTitle(),
                        e.getStatus().name() + " · " + e.getStartAt().format(dateFmt),
                        e.getStatus().name().toLowerCase(),
                        "#/events/" + e.getId()
                ))
                .toList();

        List<SearchResultDto> clubs = clubRepo
                .findByNameContainingIgnoreCase(q, limit)
                .stream()
                .map(c -> new SearchResultDto(
                        c.getId(),
                        c.getName(),
                        c.getCategory().name(),
                        null,
                        "#/clubs/" + c.getId()
                ))
                .toList();


        List<SearchResultDto> threads = threadRepo
                .findByTitleContainingIgnoreCase(q, limit)
                .stream()
                .map(t -> new SearchResultDto(
                        t.getId(),
                        t.getTitle(),
                        "Thread",
                        null,
                        "#/threads/" + t.getId()
                ))
                .toList();

        List<SearchResultDto> posts = postRepo
                .findByContentContainingIgnoreCase(q, limit)
                .stream()
                .map(p -> new SearchResultDto(
                        p.getId(),
                        truncate(p.getContent(), 60),
                        "By " + p.getAuthor(),
                        null,
                        "#/posts/" + p.getId()
                ))
                .toList();


        return new SearchResponseDto(events, clubs, threads, posts);
    }

    /* ======================================================
       DEFAULT RESULTS (NO QUERY / DISCOVERY MODE)
       ====================================================== */

    public SearchResponseDto defaultResults() {

        var limit = PageRequest.of(0, 6);
        var now = LocalDateTime.now();
        var dateFmt = DateTimeFormatter.ofPattern("MMM d");

        List<SearchResultDto> events = eventRepo
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

        List<SearchResultDto> clubs = clubRepo
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


        List<SearchResultDto> threads = threadRepo
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

        List<SearchResultDto> posts = postRepo
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


        return new SearchResponseDto(events, clubs, threads, posts);
    }

    /* ======================================================
       UTIL
       ====================================================== */

    private String truncate(String text, int len) {
        if (text == null) return "";
        return text.length() <= len ? text : text.substring(0, len) + "…";
    }
}
