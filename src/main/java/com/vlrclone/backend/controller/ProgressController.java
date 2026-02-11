package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Progress;
import com.vlrclone.backend.repository.ProgressRepository;
import com.vlrclone.backend.service.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/familiarisation")
public class ProgressController {

    private final ProgressRepository repository;
    private final CurrentUserService currentUser;

    public ProgressController(
            ProgressRepository repository,
            CurrentUserService currentUser
    ) {
        this.repository = repository;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<Progress> getMyProgress(HttpServletRequest request) {
        Long userId = currentUser.requireUser(request).getId();
        return repository.findByUserId(userId);
    }


    @PostMapping("/{taskId}")
    public ResponseEntity<?> updateTask(
            @PathVariable Integer taskId,
            @RequestBody Map<String, Boolean> body,
            HttpServletRequest request
    ) {
        Long userId = currentUser.requireUser(request).getId();

        boolean completed = body.getOrDefault("completed", false);

        Progress progress =
                repository.findByUserIdAndTaskId(userId, taskId)
                        .orElseGet(() -> {
                            Progress p = new Progress();
                            p.setUserId(userId);
                            p.setTaskId(taskId);
                            return p;
                        });

        progress.setCompleted(completed);
        repository.save(progress);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearAll(HttpServletRequest request) {

        Long userId = currentUser.requireUser(request).getId();

        List<Progress> progressList =
                repository.findByUserId(userId);

        for (Progress p : progressList) {
            p.setCompleted(false);
        }

        repository.saveAll(progressList);

        return ResponseEntity.ok().build();
    }


}
