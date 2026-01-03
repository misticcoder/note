package com.vlrclone.backend.controller;

import com.vlrclone.backend.dto.SearchResultDto;
import com.vlrclone.backend.service.TagService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping("/{name}/events")
    public List<SearchResultDto> getEventsByTag(
            @PathVariable String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        return tagService.getEventsByTag(name, page, size);
    }

}
