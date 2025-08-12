package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Thread;
import com.vlrclone.backend.repository.ThreadRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/threads")
public class ThreadController {
    private final ThreadRepository threadRepository;

    public ThreadController(ThreadRepository threadRepository) {
        this.threadRepository = threadRepository;
    }

    @GetMapping
    public List<Thread> getThreads() {
        return threadRepository.findAll();
    }

    @PostMapping
    public Thread addThread(@RequestBody Thread thread) {
        return threadRepository.save(thread);
    }
}
