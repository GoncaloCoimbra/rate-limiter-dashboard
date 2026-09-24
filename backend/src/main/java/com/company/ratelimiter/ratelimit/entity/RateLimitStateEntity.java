package com.company.ratelimiter.ratelimit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "rate_limit_state", uniqueConstraints = @UniqueConstraint(name = "uk_rate_limit_state_key", columnNames = "state_key"))
public class RateLimitStateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "state_key", nullable = false, length = 255)
    private String stateKey;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String state;

    public Long getId() {
        return id;
    }

    public String getStateKey() {
        return stateKey;
    }

    public void setStateKey(String stateKey) {
        this.stateKey = stateKey;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }
}