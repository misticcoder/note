package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Match;
import com.vlrclone.backend.repository.MatchRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchRepository matchRepository;

    public MatchController(MatchRepository matchRepository) {
        this.matchRepository = matchRepository;
    }

    @GetMapping
    public List<Match> getMatches() {
        return matchRepository.findAll();
    }

    @PostMapping
    public Match addMatch(@RequestBody Match match) {
        return matchRepository.save(match);
    }
}
