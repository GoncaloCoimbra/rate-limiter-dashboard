package com.company.ratelimiter.ratelimit.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.company.ratelimiter.ratelimit.model.RateLimitCheckResponse;
import com.company.ratelimiter.ratelimit.model.RateLimitState;

class RateLimitEngineTest {

    private final RateLimitEngine engine = new RateLimitEngine();

    @Test
    void tokenBucketAllowsFirstRequestWithNullStateAndRoundsRetryUp() {
        RateLimitCheckResponse first = engine.evaluate("TOKEN_BUCKET", 1, 1000, 1, null, 0);

        assertTrue(first.isAllowed());
        assertNotNull(first.getState());
        assertEquals(0, first.getRemaining());

        RateLimitCheckResponse blocked = engine.evaluate("TOKEN_BUCKET", 1, 1000, 1, first.getState(), 1);

        assertFalse(blocked.isAllowed());
        assertEquals(1, blocked.getRetryAfter());
    }

    @Test
    void tokenBucketRefillsAfterWindowDuration() {
        RateLimitState state = new RateLimitState();
        state.setTokens(0d);
        state.setWindowStart(0L);

        RateLimitCheckResponse response = engine.evaluate("TOKEN_BUCKET", 1, 1000, 1, state, 1000);

        assertTrue(response.isAllowed());
        assertEquals(0, response.getRemaining());
    }

    @Test
    void fixedWindowAllowsFirstRequestWithNewState() {
        RateLimitCheckResponse response = engine.evaluate("FIXED_WINDOW", 2, 1000, null, new RateLimitState(), 100);

        assertTrue(response.isAllowed());
        assertEquals(1, response.getRemaining());
        assertEquals(100L, response.getState().getWindowStart());
        assertEquals(1, response.getState().getCount());
    }

    @Test
    void fixedWindowResetsCountAfterWindowDuration() {
        RateLimitState state = new RateLimitState();
        RateLimitCheckResponse first = engine.evaluate("FIXED_WINDOW", 1, 1000, null, state, 100);

        RateLimitCheckResponse response = engine.evaluate("FIXED_WINDOW", 1, 1000, null, first.getState(), 1099);
        assertFalse(response.isAllowed());

        response = engine.evaluate("FIXED_WINDOW", 1, 1000, null, first.getState(), 1100);
        assertTrue(response.isAllowed());
        assertEquals(0, response.getRemaining());
        assertEquals(1100L, response.getState().getWindowStart());
    }

    @Test
    void slidingWindowAllowsFirstRequestWithNullState() {
        RateLimitCheckResponse response = engine.evaluate("SLIDING_WINDOW", 1, 1000, null, null, 0);

        assertTrue(response.isAllowed());
        assertEquals(0, response.getRemaining());
        assertEquals(1, response.getState().getTimestamps().size());
    }

    @Test
    void slidingWindowDropsExpiredRequestsAfterWindowDuration() {
        RateLimitCheckResponse first = engine.evaluate("SLIDING_WINDOW", 1, 1000, null, null, 0);

        RateLimitCheckResponse response = engine.evaluate("SLIDING_WINDOW", 1, 1000, null, first.getState(), 1000);
        assertTrue(response.isAllowed());
        assertEquals(1, response.getState().getTimestamps().size());
        assertEquals(1000L, response.getState().getTimestamps().get(0));
    }
}