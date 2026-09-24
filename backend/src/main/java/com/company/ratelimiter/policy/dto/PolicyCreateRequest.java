package com.company.ratelimiter.policy.dto;

import com.company.ratelimiter.policy.entity.EnvironmentType;
import com.company.ratelimiter.policy.entity.PolicyAlgorithm;
import com.company.ratelimiter.policy.entity.PolicyStatus;
import com.company.ratelimiter.policy.entity.PolicyWindow;
import com.company.ratelimiter.policy.entity.ScopeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class PolicyCreateRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String description;

    @NotNull
    private PolicyAlgorithm algorithm;

    @NotNull
    @Positive
    private Integer limit;

    @NotNull
    private PolicyWindow window;

    @NotNull
    private ScopeType scope;

    @NotNull
    private PolicyStatus status;

    @NotNull
    private Integer usage;

    @NotNull
    private EnvironmentType environment;

    @NotNull
    private Integer burst;

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
}
