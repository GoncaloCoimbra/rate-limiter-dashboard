package com.company.ratelimiter.event.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.ratelimiter.event.dto.EventResponse;
import com.company.ratelimiter.event.service.EventService;

import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public Page<EventResponse> listRecentEvents(@NonNull Pageable pageable, Authentication authentication) {
        return eventService.listRecentEvents(authentication.getName(), pageable);
    }

}