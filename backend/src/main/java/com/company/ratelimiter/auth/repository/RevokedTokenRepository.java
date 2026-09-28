package com.company.ratelimiter.auth.repository;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.ratelimiter.auth.entity.RevokedToken;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, Long> {
    boolean existsByJtiAndExpiresAtAfter(String jti, Instant now);
    void deleteByExpiresAtBefore(Instant now);
}
