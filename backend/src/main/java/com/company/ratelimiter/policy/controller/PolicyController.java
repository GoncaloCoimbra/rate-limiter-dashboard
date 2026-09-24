package com.company.ratelimiter.policy.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

import com.company.ratelimiter.policy.dto.PolicyCreateRequest;
import com.company.ratelimiter.policy.dto.PolicyResponse;
import com.company.ratelimiter.policy.dto.PolicyUpdateRequest;
import com.company.ratelimiter.policy.service.PolicyService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/policies")
public class PolicyController {

    private final PolicyService policyService;

    public PolicyController(PolicyService policyService) {
        this.policyService = policyService;
    }

    @GetMapping
    public Page<PolicyResponse> listPolicies(Pageable pageable, Authentication authentication) {
        return policyService.listPolicies(authentication.getName(), pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PolicyResponse createPolicy(@Valid @RequestBody PolicyCreateRequest request, Authentication authentication) {
        return policyService.createPolicy(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public PolicyResponse updatePolicy(@PathVariable Long id, @Valid @RequestBody PolicyUpdateRequest request, Authentication authentication) {
        return policyService.updatePolicy(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePolicy(@PathVariable Long id, Authentication authentication) {
        policyService.deletePolicy(id, authentication.getName());
    }
}
