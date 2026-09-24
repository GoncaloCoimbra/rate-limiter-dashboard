package com.company.ratelimiter.endpoint.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.company.ratelimiter.endpoint.dto.EndpointSummaryDto;
import com.company.ratelimiter.event.entity.RateLimitEvent;
import com.company.ratelimiter.event.repository.EventRepository;

@Service
public class EndpointService {

    private final EventRepository eventRepository;

    public EndpointService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public List<EndpointSummaryDto> listSummaries(String ownerUsername) {
        Map<String, List<RateLimitEvent>> eventsByEndpoint = new HashMap<>();
        for (RateLimitEvent event : eventRepository.findAllByOwnerUsername(ownerUsername)) {
            eventsByEndpoint.computeIfAbsent(event.getEndpoint(), ignored -> new ArrayList<>()).add(event);
        }

        return eventsByEndpoint.entrySet().stream()
                .map(entry -> toSummary(entry.getKey(), entry.getValue()))
                .sorted((left, right) -> Long.compare(right.getRequests(), left.getRequests()))
                .toList();
    }

    private EndpointSummaryDto toSummary(String endpoint, List<RateLimitEvent> events) {
        long blocked = events.stream().filter(event -> "BLOCKED".equalsIgnoreCase(event.getStatus())).count();
        long allowed = events.stream().filter(event -> "ALLOWED".equalsIgnoreCase(event.getStatus())).count();

        EndpointSummaryDto summary = new EndpointSummaryDto();
        summary.setEndpoint(endpoint);
        summary.setRequests(events.size());
        summary.setBlockedRequests(blocked);
        summary.setAllowedRequests(allowed);
        summary.setUsageRate(events.isEmpty() ? 0.0 : blocked * 100.0 / events.size());
        return summary;
    }
}