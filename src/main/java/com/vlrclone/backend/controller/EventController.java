package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.Event;
import com.vlrclone.backend.repository.EventRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventRepository eventRepository;

    public EventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @GetMapping
    public List<Event> getEvents() {
        return eventRepository.findAll();
    }

    @PostMapping
    public Event addEvent(@RequestBody Event event) {
        return eventRepository.save(event);
    }
}
