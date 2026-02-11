package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.UsabilityResult;
import com.vlrclone.backend.repository.UsabilityResultRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usability-results")
public class UsabilityResultController {

    private final UsabilityResultRepository repository;

    public UsabilityResultController(UsabilityResultRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody UsabilityResult result) {
        repository.save(result);
        return ResponseEntity.ok().build();
    }
}
