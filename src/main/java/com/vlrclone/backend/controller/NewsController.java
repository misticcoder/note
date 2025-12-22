package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.News;
import com.vlrclone.backend.repository.NewsRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final NewsRepository newsRepository;
    private final UserRepository userRepository;

    public NewsController(NewsRepository newsRepository, UserRepository userRepository) {
        this.newsRepository = newsRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<News> getNews() {
        return newsRepository.findAllByOrderByPinnedDescPublishedDesc();
    }

    @GetMapping("/{newsId}")
    public ResponseEntity<?> one(@PathVariable Long newsId) {
        return newsRepository.findById(newsId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404)
                        .body(Map.of("message", "News not found")));
    }

    @PostMapping
    public News add(
            @RequestBody News news,
            @RequestParam String requesterEmail) {

        news.setId(null);
        news.setPublished(Instant.now());

        var user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        news.setAuthor(user.getUsername()); // ✅ username, not email

        return newsRepository.save(news);
    }


    @PatchMapping("/{newsId}")
    public ResponseEntity<?> update(
            @PathVariable Long newsId,
            @RequestBody Map<String, Object> body) {

        var opt = newsRepository.findById(newsId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "News not found"));
        }

        var t = opt.get();

        if (body.containsKey("title")) {
            t.setTitle(Objects.toString(body.get("title"), t.getTitle()));
        }
        if (body.containsKey("content")) {
            t.setContent(Objects.toString(body.get("content"), t.getContent()));
        }

        newsRepository.save(t);
        return ResponseEntity.ok(t);
    }

    @DeleteMapping("/{newsId}")
    public ResponseEntity<?> delete(@PathVariable Long newsId) {
        if (!newsRepository.existsById(newsId)) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "News not found"));
        }
        newsRepository.deleteById(newsId);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    @PatchMapping("/{newsId}/pin")
    public ResponseEntity<?> pin(
            @PathVariable Long newsId,
            @RequestParam boolean pinned) {

        var news = newsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("News not found"));

        if (pinned) {
            // unpin all others
            newsRepository.findAll().forEach(n -> {
                if (n.isPinned()) {
                    n.setPinned(false);
                    newsRepository.save(n);
                }
            });
        }

        news.setPinned(pinned);
        newsRepository.save(news);

        return ResponseEntity.ok(news);
    }

}
