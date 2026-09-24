package com.company.ratelimiter.ratelimit.model;

public class RateLimitCheckResponse {
    private boolean allowed;
    private int remaining;
    private int limit;
    private long resetAt;
    private long retryAfter;
    private RateLimitState state;

    public boolean isAllowed() {
        return allowed;
    }

    public void setAllowed(boolean allowed) {
        this.allowed = allowed;
    }

    public int getRemaining() {
        return remaining;
    }

    public void setRemaining(int remaining) {
        this.remaining = remaining;
    }

    public int getLimit() {
        return limit;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }

    public long getResetAt() {
        return resetAt;
    }

    public void setResetAt(long resetAt) {
        this.resetAt = resetAt;
    }

    public long getRetryAfter() {
        return retryAfter;
    }

    public void setRetryAfter(long retryAfter) {
        this.retryAfter = retryAfter;
    }

    public RateLimitState getState() {
        return state;
    }

    public void setState(RateLimitState state) {
        this.state = state;
    }
}
