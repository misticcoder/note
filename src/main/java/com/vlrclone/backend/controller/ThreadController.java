package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Thread;
import com.vlrclone.backend.repository.ThreadRepository;
import com.vlrclone.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
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
    public ResponseEntity<?> update(@PathVariable("threadId") Long id, @RequestBody Map<String,Object> body) {
        var opt = threads.findById(id);
        if (opt.isEmpty()){return ResponseEntity.status(404).body(Map.of("message","Thread not found"));}
        var t = opt.get();
        if (body.containsKey("title")){
            t.setTitle(Objects.toString(body.get("title"), t.getTitle()));
        }
        if (body.containsKey("content")){
            t.setContent(Objects.toString(body.get("content"), t.getContent()));
        }
        threads.save(t);
        return ResponseEntity.ok(Map.of("status", "updated", "threadId", t.getId(), "title", t.getTitle(),
                "content", t.getContent()));

    }

    @DeleteMapping("/{threadId}")
    public ResponseEntity<?> delete(@PathVariable("threadId") Long id) {
        if (!threads.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("message","Thread not found"));
        }
        threads.deleteById(id);
        return ResponseEntity.ok(Map.of("status","success"));
    }
}
