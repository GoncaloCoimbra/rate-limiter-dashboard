package com.company.ratelimiter.event.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.company.ratelimiter.event.dto.EventResponse;
import com.company.ratelimiter.event.entity.RateLimitEvent;
import com.company.ratelimiter.event.repository.EventRepository;
import com.company.ratelimiter.policy.entity.RatePolicy;

@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public List<EventResponse> listRecentEvents(String ownerUsername) {
        return eventRepository.findAllByOwnerUsername(ownerUsername)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<EventResponse> listRecentEvents(String ownerUsername, @NonNull Pageable pageable) {
        return eventRepository.findAllByOwnerUsername(ownerUsername, pageable).map(this::toResponse);
    }

    public EventResponse recordDecision(RatePolicy policy, String clientKeyHash, boolean allowed, String endpoint) {
        RateLimitEvent event = new RateLimitEvent();
        event.setOwnerUsername(policy.getOwnerUsername());
        event.setOccurredAt(System.currentTimeMillis());
        event.setReason(allowed ? "REQUEST_ALLOWED" : "RATE_LIMIT_EXCEEDED");
        event.setEndpoint(endpoint);
        event.setStatus(allowed ? "ALLOWED" : "BLOCKED");
        event.setIpAddress(clientKeyHash);
        event.setPolicyId(policy.getId());
        return toResponse(eventRepository.save(event));
    }

    private EventResponse toResponse(RateLimitEvent event) {
        EventResponse response = new EventResponse();
        response.setId(event.getId());
        response.setOccurredAt(event.getOccurredAt());
        response.setReason(event.getReason());
        response.setEndpoint(event.getEndpoint());
        response.setStatus(event.getStatus());
        response.setIpAddress(event.getIpAddress());
        response.setPolicyId(event.getPolicyId());
        response.setCreatedAt(event.getCreatedAt());
        return response;
    }
}