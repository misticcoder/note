package com.vlrclone.backend.service;

import com.vlrclone.backend.dto.SearchResultDto;
import com.vlrclone.backend.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class TagService {

    private final EventRepository eventRepo;

    public TagService(EventRepository eventRepo) {
        this.eventRepo = eventRepo;
    }

    public List<SearchResultDto> getEventsByTag(String tagName) {

        var dateFmt = DateTimeFormatter.ofPattern("MMM d");

        return eventRepo
                .findByTags_NameIgnoreCaseOrderByStartAtAsc(tagName)
                .stream()
                .map(e -> new SearchResultDto(
                        e.getId(),
                        e.getTitle(),
                        e.getStatus().name() + " · " + e.getStartAt().format(dateFmt),
                        e.getStatus().name().toLowerCase(),
                        "#/events/" + e.getId()
                ))
                .toList();
    }
}
