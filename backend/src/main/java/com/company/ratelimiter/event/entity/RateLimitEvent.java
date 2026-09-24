package com.company.ratelimiter.event.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rate_limit_events")
public class RateLimitEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_username", nullable = false, length = 160)
    private String ownerUsername;

    @Column(nullable = false)
    private Long occurredAt;

    @Column(nullable = false, length = 64)
    private String reason;

    @Column(nullable = false, length = 255)
    private String endpoint;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(nullable = false, length = 64)
    private String ipAddress;

    @Column
    private Long policyId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public void setOwnerUsername(String ownerUsername) {
        this.ownerUsername = ownerUsername;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
