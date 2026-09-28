package com.company.ratelimiter.access.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import com.company.ratelimiter.policy.entity.RatePolicy;

@Entity
@Table(name = "api_keys")
public class ApiKey {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "owner_username", nullable = false, length = 160) private String ownerUsername;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id")
    private RatePolicy ratePolicy;
    @Column(nullable = false, length = 120) private String name;
    @Column(nullable = false, unique = true, length = 80) private String keyValue;
    @Column(name = "key_prefix", length = 16) private String keyPrefix;
    @Column(nullable = false, length = 20) private String status;
    @Column(nullable = false) private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }
    public RatePolicy getRatePolicy() { return ratePolicy; }
    public void setRatePolicy(RatePolicy ratePolicy) { this.ratePolicy = ratePolicy; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getKeyValue() { return keyValue; }
    public void setKeyValue(String keyValue) { this.keyValue = keyValue; }
    public String getKeyPrefix() { return keyPrefix; }
    public void setKeyPrefix(String keyPrefix) { this.keyPrefix = keyPrefix; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}