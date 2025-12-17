package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Thread;
import com.vlrclone.backend.repository.ThreadRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;

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
        var opt = threads.findById(id);
        if (opt.isEmpty()){return ResponseEntity.status(404).body(Map.of("message","Thread not found"));}
        var t = opt.get();
        if (body.containsKey("name")){
            t.setTitle(Objects.toString(body.get("name"), t.getTitle()));
        }
        if (body.containsKey("description")){
            t.setContent(Objects.toString(body.get("description"), t.getContent()));
        }
        threads.save(t);
        return ResponseEntity.ok(Map.of("status", "updated", "id", t.getId(), "name", t.getTitle(),
                "description", t.getContent()));

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
