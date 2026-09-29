package com.company.ratelimiter.ratelimit.service;

import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.company.ratelimiter.ratelimit.entity.RateLimitStateEntity;
import com.company.ratelimiter.ratelimit.model.RateLimitCheckResponse;
import com.company.ratelimiter.ratelimit.model.RateLimitState;
import com.company.ratelimiter.ratelimit.repository.RateLimitStateRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class RateLimitStateService {
    private static final int INITIALIZATION_LOCK_COUNT = 64;

    private final RateLimitStateRepository repository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;
    private final Object[] initializationLocks = new Object[INITIALIZATION_LOCK_COUNT];

    public RateLimitStateService(RateLimitStateRepository repository, ObjectMapper objectMapper,
                                 PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        java.util.Arrays.setAll(initializationLocks, ignored -> new Object());
    }

    public RateLimitCheckResponse evaluate(String stateKey, RateLimitEvaluation evaluation) {
        Object initializationLock = initializationLocks[Math.floorMod(stateKey.hashCode(), initializationLocks.length)];
        synchronized (initializationLock) {
            for (int attempt = 0; attempt < 10; attempt++) {
                try {
                    return transactionTemplate.execute(status -> evaluateInTransaction(stateKey, evaluation));
                } catch (DataIntegrityViolationException | CannotAcquireLockException exception) {
                    if (attempt == 9) {
                        throw exception;
                    }
                    Thread.yield();
                }
            }
            throw new IllegalStateException("Rate limit state evaluation failed");
        }
    }

    private RateLimitCheckResponse evaluateInTransaction(String stateKey, RateLimitEvaluation evaluation) {
        if (!repository.existsByStateKey(stateKey)) {
            RateLimitStateEntity newEntity = new RateLimitStateEntity();
            newEntity.setStateKey(stateKey);
            newEntity.setState(write(new RateLimitState()));
            repository.saveAndFlush(newEntity);
        }

        RateLimitStateEntity entity = repository.findForUpdate(stateKey)
                .orElseThrow(() -> new IllegalStateException("Rate limit state could not be initialized"));

        RateLimitState current = read(entity.getState());
        RateLimitCheckResponse response = evaluation.evaluate(current);
        entity.setState(write(response.getState()));
        repository.saveAndFlush(entity);
        return response;
    }

    private RateLimitState read(String json) {
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, RateLimitState.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored rate limit state is invalid", exception);
        }
    }

    private String write(RateLimitState state) {
        try {
            return objectMapper.writeValueAsString(state);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not store rate limit state", exception);
        }
    }

    @FunctionalInterface
    public interface RateLimitEvaluation {
        RateLimitCheckResponse evaluate(RateLimitState state);
    }
}