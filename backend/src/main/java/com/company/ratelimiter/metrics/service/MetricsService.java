package com.company.ratelimiter.metrics.service;

import org.springframework.stereotype.Service;

import com.company.ratelimiter.event.repository.EventRepository;
import com.company.ratelimiter.metrics.dto.MetricsComparisonDto;
import com.company.ratelimiter.metrics.dto.MetricsQueryDto;
import com.company.ratelimiter.metrics.dto.MetricsSummaryDto;
import com.company.ratelimiter.policy.repository.PolicyRepository;

@Service
public class MetricsService {

    private final PolicyRepository policyRepository;
    private final EventRepository eventRepository;

    public MetricsService(PolicyRepository policyRepository, EventRepository eventRepository) {
        this.policyRepository = policyRepository;
        this.eventRepository = eventRepository;
    }

    public MetricsSummaryDto getSummary(MetricsQueryDto query, String ownerUsername) {
        MetricsSummaryDto summary = new MetricsSummaryDto();
        long blockedRequests = eventRepository.countByOwnerAndStatusAndPeriod(ownerUsername, "BLOCKED", query.getFrom(), query.getTo());
        long allowedRequests = eventRepository.countByOwnerAndStatusAndPeriod(ownerUsername, "ALLOWED", query.getFrom(), query.getTo());
        long totalRequests = blockedRequests + allowedRequests;
        summary.setBlockedRequests(blockedRequests);
        summary.setAllowedRequests(allowedRequests);
        summary.setAverageRate(totalRequests == 0 ? 0.0 : allowedRequests * 100.0 / totalRequests);
        summary.setTotalPolicies(policyRepository.countByOwnerUsername(ownerUsername));
        return summary;
    }

    public MetricsComparisonDto compare(MetricsQueryDto current, MetricsQueryDto previous, String ownerUsername) {
        MetricsComparisonDto comparison = new MetricsComparisonDto();
        comparison.setCurrent(getSummary(current, ownerUsername));
        comparison.setPrevious(getSummary(previous, ownerUsername));
        comparison.setDelta(comparison.getCurrent().getAverageRate() - comparison.getPrevious().getAverageRate());
        return comparison;
    }
}
