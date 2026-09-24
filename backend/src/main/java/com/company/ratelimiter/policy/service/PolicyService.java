package com.company.ratelimiter.policy.service;

import com.company.ratelimiter.policy.dto.PolicyCreateRequest;
import com.company.ratelimiter.policy.dto.PolicyResponse;
import com.company.ratelimiter.policy.dto.PolicyUpdateRequest;
import com.company.ratelimiter.policy.entity.RatePolicy;
import com.company.ratelimiter.policy.repository.PolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.stream.Collectors;

@Service
public class PolicyService {
    private static final Logger log = LoggerFactory.getLogger(PolicyService.class);

    private final PolicyRepository policyRepository;

    public PolicyService(PolicyRepository policyRepository) {
        this.policyRepository = policyRepository;
    }

    public List<PolicyResponse> listPolicies(String ownerUsername) {
        return policyRepository.findAllByOwnerUsername(ownerUsername)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PolicyResponse> listPolicies(String ownerUsername, Pageable pageable) {
        return policyRepository.findAllByOwnerUsername(ownerUsername, pageable).map(this::toResponse);
    }

    @Cacheable(cacheNames = "policies", key = "#ownerUsername + ':' + #id")
    @Transactional(readOnly = true)
    public RatePolicy findPolicy(Long id, String ownerUsername) {
        return policyRepository.findByIdAndOwnerUsername(Objects.requireNonNull(id), ownerUsername)
                .orElseThrow(() -> new IllegalArgumentException("Policy not found: " + id));
    }

    @Transactional
    public PolicyResponse createPolicy(PolicyCreateRequest request, String ownerUsername) {
        RatePolicy policy = new RatePolicy();
        policy.setName(request.getName());
        policy.setDescription(request.getDescription());
        policy.setAlgorithm(request.getAlgorithm());
        policy.setLimit(request.getLimit());
        policy.setWindow(request.getWindow());
        policy.setScope(request.getScope());
        policy.setStatus(request.getStatus());
        policy.setUsage(request.getUsage());
        policy.setEnvironment(request.getEnvironment());
        policy.setBurst(request.getBurst());
        policy.setOwnerUsername(ownerUsername);
        log.info("Creating rate policy name={} owner={}", policy.getName(), ownerUsername);
        return toResponse(policyRepository.save(Objects.requireNonNull(policy)));
    }

    @Transactional
    @CacheEvict(cacheNames = "policies", key = "#ownerUsername + ':' + #id")
    public PolicyResponse updatePolicy(Long id, PolicyUpdateRequest request, String ownerUsername) {
        Long requiredId = Objects.requireNonNull(id);
        RatePolicy policy = findPolicy(requiredId, ownerUsername);

        if (request.getName() != null) policy.setName(request.getName());
        if (request.getDescription() != null) policy.setDescription(request.getDescription());
        if (request.getAlgorithm() != null) policy.setAlgorithm(request.getAlgorithm());
        if (request.getLimit() != null) policy.setLimit(request.getLimit());
        if (request.getWindow() != null) policy.setWindow(request.getWindow());
        if (request.getScope() != null) policy.setScope(request.getScope());
        if (request.getStatus() != null) policy.setStatus(request.getStatus());
        if (request.getUsage() != null) policy.setUsage(request.getUsage());
        if (request.getEnvironment() != null) policy.setEnvironment(request.getEnvironment());
        if (request.getBurst() != null) policy.setBurst(request.getBurst());

        log.info("Updating rate policy id={} owner={}", id, ownerUsername);
        return toResponse(policyRepository.save(Objects.requireNonNull(policy)));
    }

    @Transactional
    @CacheEvict(cacheNames = "policies", key = "#ownerUsername + ':' + #id")
    public void deletePolicy(Long id, String ownerUsername) {
        RatePolicy policy = findPolicy(id, ownerUsername);
        policyRepository.delete(Objects.requireNonNull(policy));
        log.info("Deleted rate policy id={} owner={}", id, ownerUsername);
    }

    private PolicyResponse toResponse(RatePolicy policy) {
        PolicyResponse response = new PolicyResponse();
        response.setId(policy.getId());
        response.setName(policy.getName());
        response.setDescription(policy.getDescription());
        response.setAlgorithm(policy.getAlgorithm());
        response.setLimit(policy.getLimit());
        response.setWindow(policy.getWindow());
        response.setScope(policy.getScope());
        response.setStatus(policy.getStatus());
        response.setUsage(policy.getUsage());
        response.setEnvironment(policy.getEnvironment());
        response.setBurst(policy.getBurst());
        response.setCreatedAt(policy.getCreatedAt());
        response.setUpdatedAt(policy.getUpdatedAt());
        return response;
    }
}
