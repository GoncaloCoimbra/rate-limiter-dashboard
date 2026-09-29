package com.company.ratelimiter.metrics.dto;

public record EndpointActivityDto(String endpoint, long requestCount, long blockedRequests) {
}