package com.company.ratelimiter.access.dto;

import jakarta.validation.constraints.NotBlank;

public class AccessCreateRequest {
    @NotBlank private String name;
    @NotBlank private String identifier;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }
}