package com.company.ratelimiter.metrics.dto;

public class MetricsSummaryDto {

    private long blockedRequests;
    private long allowedRequests;
    private double averageRate;
    private long totalPolicies;

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

    public double getAverageRate() {
        return averageRate;
    }

    public void setAverageRate(double averageRate) {
        this.averageRate = averageRate;
    }

    public long getTotalPolicies() {
        return totalPolicies;
    }

    public void setTotalPolicies(long totalPolicies) {
        this.totalPolicies = totalPolicies;
    }
}
