package com.company.ratelimiter.ratelimit.model;

import jakarta.validation.constraints.NotNull;

public class RateLimitCheckRequest {
    @NotNull
    private Long policyId;
    private String key;

    public Long getPolicyId() {
        return policyId;
    }

    public void setPolicyId(Long policyId) {
        this.policyId = policyId;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

}
