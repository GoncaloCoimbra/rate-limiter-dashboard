package com.company.ratelimiter.event.repository;

public interface EndpointActivityProjection {
    String getEndpoint();
    Long getRequestCount();
    Long getBlockedRequests();
}