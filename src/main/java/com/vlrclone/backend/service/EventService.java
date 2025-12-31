package com.vlrclone.backend.service;

import com.vlrclone.backend.dto.EventUpdateDto;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.model.Tag;
import com.vlrclone.backend.repository.EventRepository;
import com.vlrclone.backend.repository.TagRepository;
import com.vlrclone.backend.repository.spec.EventSpecifications;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final EventRepository eventRepo;
    private final TagRepository tagRepo;

    public EventService(EventRepository eventRepo, TagRepository tagRepo) {
        this.eventRepo = eventRepo;
        this.tagRepo = tagRepo;
    }

    /* =========================
       SEARCH EVENTS (NEW)
    ========================= */
    public List<Event> searchEvents(String q, List<String> tags, String status) {

        Specification<Event> spec = Specification
                .where(EventSpecifications.searchText(q))
                .and(EventSpecifications.hasTags(tags))
                .and(EventSpecifications.hasStatus(
                        status == null ? "upcoming" : status,
                        LocalDateTime.now()
                ));

        return eventRepo.findAll(spec);
    }


    /* =========================
       UPDATE EVENT
    ========================= */
    public Event updateEvent(Long id, EventUpdateDto dto) {
        Event event = eventRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        event.setTitle(dto.title);
        event.setContent(dto.content);
        event.setLocation(dto.location);
        event.setStartAt(dto.startAt);
        event.setEndAt(dto.endAt);

        // OPTIONAL (only if EventUpdateDto includes tags)
        if (dto.tags != null) {
            event.setTags(resolveTags(dto.tags));
        }

        return eventRepo.save(event);
    }

    /* =========================
       DELETE EVENT
    ========================= */
    public void deleteEvent(Long id) {
        Event event = eventRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        eventRepo.delete(event);
    }

    /* =========================
       TAG RESOLUTION (NEW)
    ========================= */
    public Set<Tag> resolveTags(List<String> names) {
        return names.stream()
                .map(s -> s.trim().toLowerCase())
                .filter(s -> !s.isBlank())
                .distinct()
                .limit(10)
                .map(name ->
                        tagRepo.findByName(name)
                                .orElseGet(() -> tagRepo.save(new Tag(name)))
                )
                .collect(Collectors.toSet());
    }
}
