package com.company.ratelimiter.auth.service;

import java.time.Instant;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ratelimiter.auth.entity.RevokedToken;
import com.company.ratelimiter.auth.repository.RevokedTokenRepository;

@Service
public class TokenRevocationService {
    private final RevokedTokenRepository repository;

    public TokenRevocationService(RevokedTokenRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void revoke(String jti, Instant expiresAt) {
        if (jti == null || expiresAt == null || !expiresAt.isAfter(Instant.now())) {
            return;
        }
        RevokedToken token = new RevokedToken();
        token.setJti(jti);
        token.setExpiresAt(expiresAt);
        repository.save(token);
    }

    @Transactional(readOnly = true)
    public boolean isRevoked(String jti) {
        return jti != null && repository.existsByJtiAndExpiresAtAfter(jti, Instant.now());
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void purgeExpiredRevocations() {
        repository.deleteByExpiresAtBefore(Instant.now());
    }
}

