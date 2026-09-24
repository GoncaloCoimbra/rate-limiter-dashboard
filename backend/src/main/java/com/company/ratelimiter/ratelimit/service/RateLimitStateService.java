package com.company.ratelimiter.ratelimit.service;

import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
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

    private final RateLimitStateRepository repository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    public RateLimitStateService(RateLimitStateRepository repository, ObjectMapper objectMapper,
                                 PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public RateLimitCheckResponse evaluate(String stateKey, RateLimitEvaluation evaluation) {
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                return transactionTemplate.execute(status -> evaluateInTransaction(stateKey, evaluation));
            } catch (DataIntegrityViolationException exception) {
                if (attempt == 2) {
                    throw exception;
                }
                Thread.yield();
            }
        }
        throw new IllegalStateException("Rate limit state evaluation failed");
    }

    private RateLimitCheckResponse evaluateInTransaction(String stateKey, RateLimitEvaluation evaluation) {
        RateLimitStateEntity entity = repository.findForUpdate(stateKey).orElseGet(() -> {
            RateLimitStateEntity newEntity = new RateLimitStateEntity();
            newEntity.setStateKey(stateKey);
            return newEntity;
        });

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