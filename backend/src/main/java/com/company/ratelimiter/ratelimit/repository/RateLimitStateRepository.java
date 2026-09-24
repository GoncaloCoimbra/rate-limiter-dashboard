package com.company.ratelimiter.ratelimit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.company.ratelimiter.ratelimit.entity.RateLimitStateEntity;

import jakarta.persistence.LockModeType;

public interface RateLimitStateRepository extends JpaRepository<RateLimitStateEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select state from RateLimitStateEntity state where state.stateKey = :stateKey")
    Optional<RateLimitStateEntity> findForUpdate(@Param("stateKey") String stateKey);
}