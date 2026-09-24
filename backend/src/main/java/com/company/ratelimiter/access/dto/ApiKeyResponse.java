package com.company.ratelimiter.access.dto;

public class ApiKeyResponse {
    private Long id;
    private String name;
    private String maskedKey;
    private String status;
    private String createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getMaskedKey() { return maskedKey; }
    public void setMaskedKey(String maskedKey) { this.maskedKey = maskedKey; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}