package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Thread;
import com.vlrclone.backend.repository.ThreadRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/threads")
public class ThreadController {
    private final ThreadRepository threads;

    public ThreadController(ThreadRepository threads) {
        this.threads = threads;
    }

    @GetMapping
    public List<Thread> all() {
        return threads.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> one(@PathVariable("id") Long id) {
        return threads.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("message","Thread not found")));
    }

    @PostMapping
    public Thread add(@RequestBody Thread thread) {
        return threads.save(thread);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") Long id, @RequestBody Map<String,Object> body) {
        return threads.findById(id).map(t -> {
            if (body.containsKey("title")) t.setTitle(String.valueOf(body.get("title")));
            if (body.containsKey("content")) t.setContent(String.valueOf(body.get("content")));
            return ResponseEntity.ok(threads.save(t));
        }).orElse(ResponseEntity.status(404).body((Thread) Map.of("message","Thread not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Long id) {
        if (!threads.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("message","Thread not found"));
        }
        threads.deleteById(id);
        return ResponseEntity.ok(Map.of("status","success"));
    }
}
