package com.company.ratelimiter.ratelimit.service;

import java.util.Objects;

import org.springframework.stereotype.Service;

import com.company.ratelimiter.ratelimit.model.RateLimitAlgorithm;
import com.company.ratelimiter.ratelimit.model.RateLimitCheckResponse;
import com.company.ratelimiter.ratelimit.model.RateLimitState;

@Service
public class RateLimitEngine {

    public RateLimitCheckResponse evaluate(String algorithm, int limit, long windowMs, Integer burst, RateLimitState state, long now) {
        RateLimitAlgorithm alg = RateLimitAlgorithm.valueOf(algorithm.toUpperCase().replace("-", "_"));
        RateLimitCheckResponse response;

        switch (alg) {
            case TOKEN_BUCKET -> response = checkTokenBucket(limit, windowMs, burst, state, now);
            case FIXED_WINDOW -> response = checkFixedWindow(limit, windowMs, state, now);
            case SLIDING_WINDOW -> response = checkSlidingWindow(limit, windowMs, state, now);
            default -> throw new IllegalArgumentException("Unsupported algorithm: " + algorithm);
        }

        if (response.getState() == null) {
            response.setState(state == null ? new RateLimitState() : state);
        }
        return response;
    }

    private RateLimitCheckResponse checkTokenBucket(int limit, long windowMs, Integer burst, RateLimitState state, long now) {
        RateLimitCheckResponse response = new RateLimitCheckResponse();
        int capacity = Math.max(limit, burst == null ? limit : burst);
        double refillPerMs = limit / (double) windowMs;

        RateLimitState currentState = state == null ? new RateLimitState() : state;
        Long previousWindowStart = currentState.getWindowStart();
        Double storedTokens = currentState.getTokens();
        long previousAt = previousWindowStart == null ? now : previousWindowStart;
        double previousTokens = storedTokens == null ? capacity : storedTokens;

        double tokens = Math.min(capacity, previousTokens + Math.max(0, now - previousAt) * refillPerMs);
        boolean allowed = tokens >= 1;
        double nextTokens = allowed ? tokens - 1 : tokens;

        // resetAt / retryAfter devem refletir quando o PRÓXIMO pedido é possível,
        // não quando o bucket enche por completo.
        long resetAt;
        long retryAfterMs;
        if (allowed) {
            // já tem pelo menos 1 token disponível agora (ou terá assim que passar 1ms)
            resetAt = now;
            retryAfterMs = 0;
        } else {
            double deficit = 1 - tokens;
            retryAfterMs = (long) Math.ceil(deficit / refillPerMs);
            resetAt = now + retryAfterMs;
        }

        response.setAllowed(allowed);
        response.setRemaining((int) Math.floor(nextTokens));
        // reporta o limit configurado, não a capacidade inflada pelo burst
        response.setLimit(limit);
        response.setResetAt(resetAt);
        response.setRetryAfter(Math.max(0, (long) Math.ceil(retryAfterMs / 1000.0)));

        currentState.setTokens(nextTokens);
        currentState.setWindowStart(now);
        response.setState(currentState);
        return response;
    }

    private RateLimitCheckResponse checkFixedWindow(int limit, long windowMs, RateLimitState state, long now) {
        RateLimitCheckResponse response = new RateLimitCheckResponse();
        RateLimitState currentState = state == null ? new RateLimitState() : state;

        Long previousWindowStart = currentState.getWindowStart();
        long windowStart = previousWindowStart == null || now >= previousWindowStart + windowMs
                ? now
            : previousWindowStart;
        Integer storedCount = currentState.getCount();
        int count = Objects.equals(windowStart, previousWindowStart)
            ? (storedCount == null ? 0 : storedCount)
            : 0;
        boolean allowed = count < limit;
        int nextCount = allowed ? count + 1 : count;
        long resetAt = windowStart + windowMs;

        response.setAllowed(allowed);
        response.setRemaining(Math.max(0, limit - nextCount));
        response.setLimit(limit);
        response.setResetAt(resetAt);
        response.setRetryAfter(Math.max(0, (long) Math.ceil((resetAt - now) / 1000.0)));

        currentState.setWindowStart(windowStart);
        currentState.setCount(nextCount);
        response.setState(currentState);
        return response;
    }

    private RateLimitCheckResponse checkSlidingWindow(int limit, long windowMs, RateLimitState state, long now) {
        RateLimitCheckResponse response = new RateLimitCheckResponse();
        RateLimitState currentState = state == null ? new RateLimitState() : state;
        java.util.List<Long> timestamps = currentState.getTimestamps() == null ? new java.util.ArrayList<>() : currentState.getTimestamps();
        timestamps = timestamps.stream().filter(timestamp -> timestamp > now - windowMs).toList();

        boolean allowed = timestamps.size() < limit;
        java.util.List<Long> nextTimestamps = allowed ? new java.util.ArrayList<>(timestamps) : timestamps;
        if (allowed) {
            nextTimestamps.add(now);
        }

        Long oldestTimestamp = nextTimestamps.isEmpty() ? null : nextTimestamps.get(0);
        long oldest = oldestTimestamp == null ? now : oldestTimestamp;
        long resetAt = oldest + windowMs;

        response.setAllowed(allowed);
        response.setRemaining(Math.max(0, limit - nextTimestamps.size()));
        response.setLimit(limit);
        response.setResetAt(resetAt);
        response.setRetryAfter(Math.max(0, (long) Math.ceil((resetAt - now) / 1000.0)));

        currentState.setTimestamps(nextTimestamps);
        response.setState(currentState);
        return response;
    }
}