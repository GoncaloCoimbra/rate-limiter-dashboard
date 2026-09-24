package com.company.ratelimiter.endpoint.service;

import com.company.ratelimiter.event.entity.RateLimitEvent;
import com.company.ratelimiter.event.repository.EventRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EndpointServiceTest {
    @Test
    void groupsRequestsByEndpointAndCountsBlockedTraffic() {
        EventRepository repository = mock(EventRepository.class);
        RateLimitEvent allowed = event("GET /orders", "ALLOWED");
        RateLimitEvent blocked = event("GET /orders", "BLOCKED");
        allowed.setOwnerUsername("owner@example.com");
        blocked.setOwnerUsername("owner@example.com");
        when(repository.findAll()).thenReturn(List.of(allowed, blocked));
        when(repository.findAllByOwnerUsername("owner@example.com")).thenReturn(List.of(allowed, blocked));

        var summaries = new EndpointService(repository).listSummaries("owner@example.com");

        assertEquals(1, summaries.size());
        assertEquals("GET /orders", summaries.get(0).getEndpoint());
        assertEquals(2, summaries.get(0).getRequests());
        assertEquals(1, summaries.get(0).getBlockedRequests());
        assertEquals(50.0, summaries.get(0).getUsageRate());
    }

    private RateLimitEvent event(String endpoint, String status) {
        RateLimitEvent event = new RateLimitEvent();
        event.setEndpoint(endpoint);
        event.setStatus(status);
        return event;
    }
}