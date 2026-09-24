package com.company.ratelimiter.metrics.service;

import com.company.ratelimiter.event.entity.RateLimitEvent;
import com.company.ratelimiter.event.repository.EventRepository;
import com.company.ratelimiter.metrics.dto.MetricsQueryDto;
import com.company.ratelimiter.policy.repository.PolicyRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MetricsServiceTest {
    @Test
    void calculatesSummaryFromPersistedEventsAndPolicies() {
        PolicyRepository policies = mock(PolicyRepository.class);
        EventRepository events = mock(EventRepository.class);
        when(policies.countByOwnerUsername("owner@example.com")).thenReturn(3L);
        RateLimitEvent allowed = event("ALLOWED");
        RateLimitEvent blocked = event("BLOCKED");
        when(events.countByOwnerAndStatusAndPeriod("owner@example.com", "ALLOWED", null, null)).thenReturn(1L);
        when(events.countByOwnerAndStatusAndPeriod("owner@example.com", "BLOCKED", null, null)).thenReturn(1L);

        var summary = new MetricsService(policies, events).getSummary(new MetricsQueryDto(), "owner@example.com");

        assertEquals(1, summary.getAllowedRequests());
        assertEquals(1, summary.getBlockedRequests());
        assertEquals(50.0, summary.getAverageRate());
        assertEquals(3, summary.getTotalPolicies());
    }

    private RateLimitEvent event(String status) {
        RateLimitEvent event = new RateLimitEvent();
        event.setStatus(status);
        return event;
    }
}