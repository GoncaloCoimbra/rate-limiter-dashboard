package com.company.ratelimiter.policy.dto;

import com.company.ratelimiter.policy.entity.EnvironmentType;
import com.company.ratelimiter.policy.entity.PolicyAlgorithm;
import com.company.ratelimiter.policy.entity.PolicyStatus;
import com.company.ratelimiter.policy.entity.PolicyWindow;
import com.company.ratelimiter.policy.entity.ScopeType;
import java.time.LocalDateTime;

public class PolicyResponse {

    private Long id;
    private String name;
    private String description;
    private PolicyAlgorithm algorithm;
    private Integer limit;
    private PolicyWindow window;
    private ScopeType scope;
    private PolicyStatus status;
    private Integer usage;
    private EnvironmentType environment;
    private Integer burst;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
