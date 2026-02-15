package com.vlrclone.backend.controller;

import com.vlrclone.backend.dto.EventUpdateDto;
import com.vlrclone.backend.dto.PostFeedDto;
import com.vlrclone.backend.model.ClubNews;
import com.vlrclone.backend.model.Thread;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.ClubNewsRepository;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.ThreadRepository;
import com.vlrclone.backend.repository.UserRepository;
import com.vlrclone.backend.service.ClubService;
import com.vlrclone.backend.service.EventService;
import com.vlrclone.backend.service.PostService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/home")
public class HomeController {

    private final ThreadRepository threads;
    private final ClubNewsRepository news;
    private final EventService eventService;
    private final ClubService clubService;
    private final PostService postService;
    private final UserRepository users;

    public HomeController(
            ThreadRepository threads,
            ClubNewsRepository news,
            EventService eventService,
            ClubService clubService,
            PostService postService,
            UserRepository users
    ) {
        this.threads = threads;
        this.news = news;
        this.eventService = eventService;
        this.clubService = clubService;
        this.postService = postService;
        this.users = users;
    }

    @GetMapping
    public Map<String, Object> getHomePage(
            @RequestParam(required = false) String requesterEmail
    ) {
        User user = (requesterEmail != null && !requesterEmail.isBlank())
                ? users.findByEmail(requesterEmail).orElse(null)
                : null;

        Map<String, Object> response = new HashMap<>();

        // Threads
        List<Thread> threadsList = threads.findAllByOrderByPublishedDesc();
        response.put("threads", threadsList);

        // News
        List<ClubNews> newsList = news.findTop10ByOrderByCreatedAtDesc();
        response.put("news", newsList);

        // Events
        List<EventUpdateDto> eventsList = eventService
                .searchEventsEntities(null, null, "ALL", null, user)
                .stream()
                .map(EventUpdateDto::new)
                .toList();
        response.put("events", eventsList);

        // Clubs
        List<ClubService.ClubWithCounts> clubsList = clubService.findAllWithCounts(null);
        response.put("clubs", clubsList);

        // Posts
        List<PostFeedDto> postsList = postService.getFeed(
                user != null ? user.getUsername() : null,
                null
        );
        response.put("posts", postsList);

        // Users (for admin)
        if (user != null && user.getRole() == User.Role.ADMIN) {
            response.put("users", users.findAll());
        }

        return response;
    }
}