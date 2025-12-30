package com.vlrclone.backend.service;

import com.vlrclone.backend.dto.EventUpdateDto;
import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.repository.EventRepository;
import org.springframework.stereotype.Service;

@Service
public class EventService {

    private final EventRepository eventRepo;

    public EventService(EventRepository eventRepo) {
        this.eventRepo = eventRepo;
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
}
