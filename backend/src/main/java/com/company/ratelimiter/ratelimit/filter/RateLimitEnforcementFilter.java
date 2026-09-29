package com.company.ratelimiter.ratelimit.filter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Objects;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.company.ratelimiter.access.entity.ApiKey;
import com.company.ratelimiter.access.repository.ApiKeyRepository;
import com.company.ratelimiter.event.service.EventService;
import com.company.ratelimiter.policy.entity.PolicyStatus;
import com.company.ratelimiter.policy.entity.RatePolicy;
import com.company.ratelimiter.ratelimit.model.RateLimitCheckResponse;
import com.company.ratelimiter.ratelimit.service.RateLimitEngine;
import com.company.ratelimiter.ratelimit.service.RateLimitStateService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitEnforcementFilter extends OncePerRequestFilter {
    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String ACTIVE = "ACTIVE";

    private final AntPathRequestMatcher publicApiMatcher = new AntPathRequestMatcher("/api/public/**");
    private final ApiKeyRepository apiKeyRepository;
    private final RateLimitEngine rateLimitEngine;
    private final RateLimitStateService stateService;
    private final EventService eventService;

    public RateLimitEnforcementFilter(ApiKeyRepository apiKeyRepository,
                                      RateLimitEngine rateLimitEngine,
                                      RateLimitStateService stateService,
                                      EventService eventService) {
        this.apiKeyRepository = apiKeyRepository;
        this.rateLimitEngine = rateLimitEngine;
        this.stateService = stateService;
        this.eventService = eventService;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !publicApiMatcher.matches(request);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String apiKeyValue = request.getHeader(API_KEY_HEADER);
        if (apiKeyValue == null || apiKeyValue.isBlank()) {
            reject(response, HttpStatus.UNAUTHORIZED, "API key is required");
            return;
        }

        String clientKeyHash = hash(apiKeyValue);
        ApiKey apiKey = apiKeyRepository.findByKeyValueAndStatus(clientKeyHash, ACTIVE)
            .orElse(null);
        if (apiKey == null) {
            reject(response, HttpStatus.UNAUTHORIZED, "Invalid API key");
            return;
        }

        RatePolicy policy = apiKey.getRatePolicy();
        if (policy == null || policy.getStatus() != PolicyStatus.ACTIVE) {
            // Fail closed: an unconfigured key must never bypass traffic protection.
            reject(response, HttpStatus.FORBIDDEN, "API key has no active rate policy");
            return;
        }

        long now = System.currentTimeMillis();
        String stateKey = "policy:" + policy.getId() + ":api-key:" + clientKeyHash;
        RateLimitCheckResponse decision = stateService.evaluate(stateKey, state -> rateLimitEngine.evaluate(
                policy.getAlgorithm().name(),
                policy.getLimit(),
                windowMs(policy),
                policy.getBurst(),
                state,
                now));

        eventService.recordDecision(policy, clientKeyHash, decision.isAllowed(), request.getMethod() + " " + request.getRequestURI());
        writeRateLimitHeaders(response, decision);
        if (!decision.isAllowed()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static long windowMs(RatePolicy policy) {
        return switch (policy.getWindow()) {
            case SECOND -> 1_000L;
            case MINUTE -> 60_000L;
            case HOUR -> 3_600_000L;
            case DAY -> 86_400_000L;
        };
    }

    private static void writeRateLimitHeaders(HttpServletResponse response, RateLimitCheckResponse decision) {
        response.setHeader("X-RateLimit-Limit", String.valueOf(decision.getLimit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(decision.getRemaining()));
        response.setHeader("X-RateLimit-Reset", String.valueOf((decision.getResetAt() + 999L) / 1_000L));
        if (!decision.isAllowed()) {
            response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(decision.getRetryAfter()));
        }
    }

    private static void reject(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.sendError(status.value(), message);
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(digest.length * 2);
            for (byte item : digest) {
                result.append(String.format("%02x", item));
            }
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
