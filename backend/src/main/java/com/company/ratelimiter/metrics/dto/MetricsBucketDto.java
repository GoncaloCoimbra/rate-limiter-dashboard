package com.company.ratelimiter.metrics.dto;

public record MetricsBucketDto(long bucketStart, long allowedRequests, long blockedRequests) {
}