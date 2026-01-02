package com.vlrclone.backend.controller;

import com.vlrclone.backend.dto.SearchResponseDto;
import com.vlrclone.backend.service.SearchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public SearchResponseDto search(
            @RequestParam(required = false) String q
    ) {
        if (q == null || q.trim().length() < 2) {
            return searchService.defaultResults();
        }

        return searchService.search(q.trim());
    }
}
