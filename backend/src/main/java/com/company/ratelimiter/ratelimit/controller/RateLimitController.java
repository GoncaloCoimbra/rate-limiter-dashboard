package com.company.ratelimiter.ratelimit.controller;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Objects;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.company.ratelimiter.common.ApiResponse;
import com.company.ratelimiter.policy.entity.PolicyStatus;
import com.company.ratelimiter.policy.entity.PolicyWindow;
import com.company.ratelimiter.policy.service.PolicyService;
import com.company.ratelimiter.event.service.EventService;
import com.company.ratelimiter.ratelimit.model.RateLimitCheckRequest;
import com.company.ratelimiter.ratelimit.model.RateLimitCheckResponse;
import com.company.ratelimiter.ratelimit.service.RateLimitEngine;
import com.company.ratelimiter.ratelimit.service.RateLimitStateService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class RateLimitController {
    private static final Logger log = LoggerFactory.getLogger(RateLimitController.class);

    private final RateLimitEngine rateLimitEngine;
    private final RateLimitStateService stateService;
    private final PolicyService policyService;
    private final EventService eventService;

    public RateLimitController(RateLimitEngine rateLimitEngine, RateLimitStateService stateService,
                               PolicyService policyService, EventService eventService) {
        this.rateLimitEngine = rateLimitEngine;
        this.stateService = stateService;
        this.policyService = policyService;
        this.eventService = eventService;
    }

    @PostMapping("/ratelimit/check")
    public ApiResponse<RateLimitCheckResponse> check(@Valid @RequestBody RateLimitCheckRequest request, Authentication authentication) {
        Long policyId = Objects.requireNonNull(request.getPolicyId());
        var policy = policyService.findPolicy(policyId, authentication.getName());
        if (policy.getStatus() != PolicyStatus.ACTIVE) {
            throw new IllegalArgumentException("Policy is not active");
        }
        String clientKey = request.getKey() == null || request.getKey().isBlank() ? "anonymous" : request.getKey();
        String clientKeyHash = hash(clientKey);
        String stateKey = "policy:" + policyId + ":client:" + clientKeyHash;
        long now = System.currentTimeMillis();
        RateLimitCheckResponse response = stateService.evaluate(stateKey, state -> rateLimitEngine.evaluate(
            policy.getAlgorithm().name(), policy.getLimit(), windowMs(policy.getWindow()), policy.getBurst(), state, now
        ));
        eventService.recordDecision(policy, clientKeyHash, response.isAllowed(), "POST /api/ratelimit/check");
        if (!response.isAllowed()) log.warn("Rate limit denied policyId={} owner={} clientKeyHash={}", policyId, authentication.getName(), clientKeyHash);
        return ApiResponse.ok(response);
    }

    private static long windowMs(PolicyWindow window) {
        return switch (window) {
            case SECOND -> 1_000L;
            case MINUTE -> 60_000L;
            case HOUR -> 3_600_000L;
            case DAY -> 86_400_000L;
        };
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte item : digest) result.append(String.format("%02x", item));
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
