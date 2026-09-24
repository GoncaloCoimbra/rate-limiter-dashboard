package com.company.ratelimiter.policy.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "rate_policies")
public class RatePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_username", nullable = false, length = 160)
    private String ownerUsername;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyAlgorithm algorithm;

    @Column(name = "request_limit", nullable = false)
    private Integer limit;

    @Enumerated(EnumType.STRING)
    @Column(name = "window_unit", nullable = false)
    private PolicyWindow window;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScopeType scope;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyStatus status;

    @Column(name = "usage_count", nullable = false)
    private Integer usage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnvironmentType environment;

    @Column(nullable = false)
    private Integer burst;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.usage == null) {
            this.usage = 0;
        }
        if (this.burst == null) {
            this.burst = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public PolicyAlgorithm getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(PolicyAlgorithm algorithm) {
        this.algorithm = algorithm;
    }

    public Integer getLimit() {
        return limit;
    }

    public void setLimit(Integer limit) {
        this.limit = limit;
    }

    public PolicyWindow getWindow() {
        return window;
    }

    public void setWindow(PolicyWindow window) {
        this.window = window;
    }

    public ScopeType getScope() {
        return scope;
    }

    public void setScope(ScopeType scope) {
        this.scope = scope;
    }

    public PolicyStatus getStatus() {
        return status;
    }

    public void setStatus(PolicyStatus status) {
        this.status = status;
    }

    public Integer getUsage() {
        return usage;
    }

    public void setUsage(Integer usage) {
        this.usage = usage;
    }

    public EnvironmentType getEnvironment() {
        return environment;
    }

    public void setEnvironment(EnvironmentType environment) {
        this.environment = environment;
    }

    public Integer getBurst() {
        return burst;
    }

    public void setBurst(Integer burst) {
        this.burst = burst;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
