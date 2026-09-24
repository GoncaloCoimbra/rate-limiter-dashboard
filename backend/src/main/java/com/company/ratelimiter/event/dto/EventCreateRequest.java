package com.company.ratelimiter.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class EventCreateRequest {

    private Long occurredAt;

    @NotBlank
    private String reason;

    @NotBlank
    private String endpoint;

    @NotBlank
    private String status;

    @NotBlank
    private String ipAddress;

    @Positive
    private Long policyId;

    public Long getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(Long occurredAt) {
        this.occurredAt = occurredAt;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public Long getPolicyId() {
        return policyId;
    }

    public void setPolicyId(Long policyId) {
        this.policyId = policyId;
    }
}
