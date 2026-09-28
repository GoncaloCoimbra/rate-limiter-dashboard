package com.company.ratelimiter.access.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class ApiKeyCreateRequest {
    @NotBlank private String name;
    @Positive private Long policyId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getPolicyId() { return policyId; }
    public void setPolicyId(Long policyId) { this.policyId = policyId; }
}