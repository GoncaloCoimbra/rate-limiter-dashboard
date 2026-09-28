package com.company.ratelimiter.auth.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.ratelimiter.auth.entity.AppUser;
import com.company.ratelimiter.auth.entity.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenAndExpiresAtAfter(String token, Instant now);
    void deleteAllByUser(AppUser user);
    void deleteByExpiresAtBefore(Instant now);
}
