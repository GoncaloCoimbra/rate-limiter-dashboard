package com.company.ratelimiter.auth.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;

@Service
public class LoginAttemptService {
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor();

    public LoginAttemptService() {
        // sem isto, entradas expiradas nunca são removidas e a memória cresce indefinidamente
        cleaner.scheduleAtFixedRate(this::evictExpired, 5, 5, TimeUnit.MINUTES);
    }

    public boolean isBlocked(String key) {
        Attempt attempt = attempts.get(key);
        return attempt != null && !attempt.expired() && attempt.count >= MAX_ATTEMPTS;
    }

    public void failure(String key) {
        attempts.compute(key, (ignored, current) -> {
            if (current == null || current.expired()) return new Attempt(1, Instant.now());
            return new Attempt(current.count + 1, current.startedAt);
        });
    }

    public void success(String key) {
        attempts.remove(key);
    }

    private void evictExpired() {
        attempts.entrySet().removeIf(entry -> entry.getValue().expired());
    }

    @PreDestroy
    void shutdown() {
        cleaner.shutdownNow();
    }

    private record Attempt(int count, Instant startedAt) {
        boolean expired() { return startedAt.plus(WINDOW).isBefore(Instant.now()); }
    }
}