package com.company.ratelimiter.endpoint.dto;

public class EndpointSummaryDto {
    private String endpoint;
    private long requests;
    private long blockedRequests;
    private long allowedRequests;
    private double usageRate;

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public long getRequests() {
        return requests;
    }

    public void setRequests(long requests) {
        this.requests = requests;
    }

    public long getBlockedRequests() {
        return blockedRequests;
    }

    public void setBlockedRequests(long blockedRequests) {
        this.blockedRequests = blockedRequests;
    }

    public long getAllowedRequests() {
        return allowedRequests;
    }

    public void setAllowedRequests(long allowedRequests) {
        this.allowedRequests = allowedRequests;
    }

    public double getUsageRate() {
        return usageRate;
    }

    public void setUsageRate(double usageRate) {
        this.usageRate = usageRate;
    }
}