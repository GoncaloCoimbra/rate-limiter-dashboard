package com.company.ratelimiter.ratelimit.service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.company.ratelimiter.ratelimit.entity.RateLimitStateEntity;
import com.company.ratelimiter.ratelimit.model.RateLimitCheckResponse;
import com.company.ratelimiter.ratelimit.repository.RateLimitStateRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@DataJpaTest
@Import({RateLimitStateService.class, RateLimitEngine.class, RateLimitStateServiceConcurrencyTest.TestConfig.class})
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false"
})
class RateLimitStateServiceConcurrencyTest {

    @TestConfiguration
    static class TestConfig {
        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper();
        }
    }

    private static final String STATE_KEY = "policy:1:FIXED_WINDOW:client-1";

    @Autowired
    private RateLimitStateService stateService;

    @Autowired
    private RateLimitStateRepository repository;

    @Autowired
    private ObjectMapper objectMapper;

    private final ExecutorService executor = Executors.newFixedThreadPool(8);

    @AfterEach
    void shutdownExecutor() {
        executor.shutdownNow();
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void serializesConcurrentEvaluationsForTheSameClient() throws Exception {
        RateLimitStateEntity initial = new RateLimitStateEntity();
        initial.setStateKey(STATE_KEY);
        initial.setState(objectMapper.writeValueAsString(new com.company.ratelimiter.ratelimit.model.RateLimitState()));
        repository.saveAndFlush(initial);

        CountDownLatch start = new CountDownLatch(1);
        List<CompletableFuture<RateLimitCheckResponse>> requests = new ArrayList<>();
        for (int index = 0; index < 8; index++) {
            requests.add(CompletableFuture.supplyAsync(() -> {
                await(start);
                return stateService.evaluate(STATE_KEY, state -> new RateLimitEngine().evaluate(
                        "FIXED_WINDOW", 1, 60_000, null, state, 1_000));
            }, executor));
        }

        start.countDown();
        long allowed = 0;
        for (CompletableFuture<RateLimitCheckResponse> request : requests) {
            if (request.join().isAllowed()) {
                allowed++;
            }
        }

        assertEquals(1, allowed);
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }
}