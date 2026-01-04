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
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "999") int size
    ) {
        q = q.trim();

        if (q.isEmpty()) {
            return SearchResponseDto.empty(); // or however you represent empty results
        }

        return searchService.search(q, page, size);
    }

}
