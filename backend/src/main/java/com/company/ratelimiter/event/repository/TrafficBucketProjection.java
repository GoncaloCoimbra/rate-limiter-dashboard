package com.company.ratelimiter.event.repository;

public interface TrafficBucketProjection {
    Long getBucketStart();
    Long getAllowedRequests();
    Long getBlockedRequests();
}