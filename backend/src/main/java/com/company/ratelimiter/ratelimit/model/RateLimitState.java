package com.company.ratelimiter.ratelimit.model;

import java.util.ArrayList;
import java.util.List;

public class RateLimitState {
    private Double tokens;
    private Long windowStart;
    private Integer count;
    private List<Long> timestamps = new ArrayList<>();

    public Double getTokens() {
        return tokens;
    }

    public void setTokens(Double tokens) {
        this.tokens = tokens;
    }

    public Long getWindowStart() {
        return windowStart;
    }

    public void setWindowStart(Long windowStart) {
        this.windowStart = windowStart;
    }

    public Integer getCount() {
        return count;
    }

    public void setCount(Integer count) {
        this.count = count;
    }

    public List<Long> getTimestamps() {
        return timestamps;
    }

    public void setTimestamps(List<Long> timestamps) {
        this.timestamps = timestamps;
    }
}
