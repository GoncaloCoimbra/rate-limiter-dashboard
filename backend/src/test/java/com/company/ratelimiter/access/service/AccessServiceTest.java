package com.company.ratelimiter.access.service;

import com.company.ratelimiter.access.dto.ApiKeyCreateRequest;
import com.company.ratelimiter.access.entity.ApiKey;
import com.company.ratelimiter.access.repository.ApiKeyRepository;
import com.company.ratelimiter.access.repository.RateClientRepository;
import com.company.ratelimiter.policy.entity.PolicyStatus;
import com.company.ratelimiter.policy.entity.RatePolicy;
import com.company.ratelimiter.policy.repository.PolicyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AccessServiceTest {
    @Test
    void revokeKeyPersistsRevokedStatus() {
        ApiKeyRepository keys = mock(ApiKeyRepository.class);
        RateClientRepository clients = mock(RateClientRepository.class);
        PolicyRepository policies = mock(PolicyRepository.class);
        ApiKey key = new ApiKey(); key.setName("test"); key.setKeyValue("rl_test"); key.setStatus("ACTIVE");
        ReflectionTestUtils.setField(key, "createdAt", LocalDateTime.now());
        when(keys.findByIdAndOwnerUsername(1L, "owner@example.com")).thenReturn(Optional.of(key)); when(keys.save(key)).thenReturn(key);

        var response = new AccessService(keys, clients, policies).revokeKey(1L, "owner@example.com");

        assertEquals("REVOKED", response.getStatus());
        verify(keys).save(key);
    }

    @Test
    void updateKeyChangesNameWithoutChangingSecret() {
        ApiKeyRepository keys = mock(ApiKeyRepository.class);
        RateClientRepository clients = mock(RateClientRepository.class);
        PolicyRepository policies = mock(PolicyRepository.class);
        ApiKey key = new ApiKey(); key.setName("old"); key.setKeyValue("rl_secret"); key.setKeyPrefix("rl_secre"); key.setStatus("ACTIVE");
        ReflectionTestUtils.setField(key, "createdAt", LocalDateTime.now());
        when(keys.findByIdAndOwnerUsername(1L, "owner@example.com")).thenReturn(Optional.of(key)); when(keys.save(key)).thenReturn(key);
        ApiKeyCreateRequest request = new ApiKeyCreateRequest(); request.setName("new");

        var response = new AccessService(keys, clients, policies).updateKey(1L, request, "owner@example.com");

        assertEquals("new", response.getName());
        assertEquals("rl_secre******", response.getMaskedKey());
    }

    @Test
    void createKeyGeneratesSecureRandomValue() {
        ApiKeyRepository keys = mock(ApiKeyRepository.class);
        RateClientRepository clients = mock(RateClientRepository.class);
        PolicyRepository policies = mock(PolicyRepository.class);
        RatePolicy policy = new RatePolicy();
        policy.setStatus(PolicyStatus.ACTIVE);
        ReflectionTestUtils.setField(policy, "id", 7L);
        when(policies.findByIdAndOwnerUsername(7L, "owner@example.com")).thenReturn(Optional.of(policy));
        when(keys.save(any(ApiKey.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ApiKeyCreateRequest request = new ApiKeyCreateRequest();
        request.setName("Secure key");
        request.setPolicyId(7L);

        var response = new AccessService(keys, clients, policies).createKey(request, "owner@example.com");

        assertTrue(response.getMaskedKey().startsWith("rl_"));
        assertTrue(response.getMaskedKey().endsWith("******"));
        assertTrue(response.getMaskedKey().length() >= 11);
        verify(keys).save(any(ApiKey.class));
    }
}