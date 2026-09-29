package com.company.ratelimiter.metrics.service;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import java.util.List;

import com.company.ratelimiter.event.repository.EndpointActivityProjection;
import com.company.ratelimiter.event.repository.EventRepository;
import com.company.ratelimiter.event.repository.TrafficBucketProjection;
import com.company.ratelimiter.metrics.dto.EndpointActivityDto;
import com.company.ratelimiter.metrics.dto.MetricsComparisonDto;
import com.company.ratelimiter.metrics.dto.MetricsBucketDto;
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

    public List<MetricsBucketDto> getTrafficSeries(MetricsQueryDto query, String ownerUsername) {
        long from = query.getFrom();
        long to = query.getTo();
        long bucketMillis = Math.max(1, (to - from) / 24);
        return eventRepository.findTrafficBuckets(ownerUsername, from, to, bucketMillis).stream()
                .map(this::toBucket)
                .toList();
    }

    public List<EndpointActivityDto> getEndpointActivity(MetricsQueryDto query, String ownerUsername, int limit) {
        List<EndpointActivityProjection> activity = eventRepository.findEndpointActivity(
                ownerUsername, query.getFrom(), query.getTo(), PageRequest.of(0, Math.clamp(limit, 1, 20)));
        return activity.stream()
                .map(item -> new EndpointActivityDto(item.getEndpoint(), item.getRequestCount(), item.getBlockedRequests()))
                .toList();
    }

    private MetricsBucketDto toBucket(TrafficBucketProjection bucket) {
        return new MetricsBucketDto(bucket.getBucketStart(), bucket.getAllowedRequests(), bucket.getBlockedRequests());
    }
}
