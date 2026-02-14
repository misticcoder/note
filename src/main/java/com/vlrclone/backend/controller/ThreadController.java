package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Thread;
import com.vlrclone.backend.model.User;
import com.vlrclone.backend.repository.ThreadRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/threads")
public class ThreadController {
    private final ThreadRepository threads;
    private final UserRepository users;

    public ThreadController(ThreadRepository threads, UserRepository users) {
        this.threads = threads;
        this.users = users;
    }

    @GetMapping
    public List<Thread> getThreads() {
        return threads.findAllByOrderByPublishedDesc();
    }

    @GetMapping("/{threadId}")
    public ResponseEntity<?> one(@PathVariable("threadId") Long id) {
        return threads.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("message","Thread not found")));
    }

    @PostMapping
    public ResponseEntity<?> add(
            @RequestBody Thread thread,
            @RequestParam String requesterEmail
    ) {
        var userOpt = users.findByEmail(requesterEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "User not found"));
        }

        var user = userOpt.get();

        thread.setId(null);
        thread.setAuthor(user.getUsername());

        return ResponseEntity.ok(threads.save(thread));
    }

    @PatchMapping("/{threadId}")
    public ResponseEntity<?> update(
            @PathVariable("threadId") Long id,
            @RequestBody Map<String, Object> body,
            @RequestParam String requesterEmail  // ✅ ADD THIS
    ) {
        // Find thread
        var opt = threads.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Thread not found"));
        }
        var thread = opt.get();

        // Find user
        var userOpt = users.findByEmail(requesterEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "User not found"));
        }
        var user = userOpt.get();

        // ✅ CHECK PERMISSION: user must be admin OR author
        boolean isAdmin = user.getRole() == User.Role.ADMIN;
        boolean isAuthor = thread.getAuthor().equals(user.getUsername());

        if (!isAdmin && !isAuthor) {
            return ResponseEntity.status(403).body(Map.of("message", "Not allowed to edit this thread"));
        }

        // Update fields
        if (body.containsKey("title")) {
            thread.setTitle(Objects.toString(body.get("title"), thread.getTitle()));
        }
        if (body.containsKey("content")) {
            thread.setContent(Objects.toString(body.get("content"), thread.getContent()));
        }

        threads.save(thread);

        return ResponseEntity.ok(Map.of(
                "status", "updated",
                "threadId", thread.getId(),
                "title", thread.getTitle(),
                "content", thread.getContent()
        ));
    }

    @DeleteMapping("/{threadId}")
    public ResponseEntity<?> delete(
            @PathVariable("threadId") Long id,
            @RequestParam String requesterEmail  // ✅ ADD THIS
    ) {
        // Find thread
        var opt = threads.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Thread not found"));
        }
        var thread = opt.get();

        // Find user
        var userOpt = users.findByEmail(requesterEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "User not found"));
        }
        var user = userOpt.get();

        // ✅ CHECK PERMISSION: user must be admin OR author
        boolean isAdmin = user.getRole() == User.Role.ADMIN;
        boolean isAuthor = thread.getAuthor().equals(user.getUsername());

        if (!isAdmin && !isAuthor) {
            return ResponseEntity.status(403).body(Map.of("message", "Not allowed to delete this thread"));
        }

        threads.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "success"));
    }
}