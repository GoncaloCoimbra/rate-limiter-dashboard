package com.company.ratelimiter.access.service;

import com.company.ratelimiter.access.dto.ApiKeyCreateRequest;
import com.company.ratelimiter.access.entity.ApiKey;
import com.company.ratelimiter.access.repository.ApiKeyRepository;
import com.company.ratelimiter.access.repository.RateClientRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class AccessServiceTest {
    @Test
    void revokeKeyPersistsRevokedStatus() {
        ApiKeyRepository keys = mock(ApiKeyRepository.class);
        RateClientRepository clients = mock(RateClientRepository.class);
        ApiKey key = new ApiKey(); key.setName("test"); key.setKeyValue("rl_test"); key.setStatus("ACTIVE");
        ReflectionTestUtils.setField(key, "createdAt", LocalDateTime.now());
        when(keys.findByIdAndOwnerUsername(1L, "owner@example.com")).thenReturn(Optional.of(key)); when(keys.save(key)).thenReturn(key);

        var response = new AccessService(keys, clients).revokeKey(1L, "owner@example.com");

        assertEquals("REVOKED", response.getStatus());
        verify(keys).save(key);
    }

    @Test
    void updateKeyChangesNameWithoutChangingSecret() {
        ApiKeyRepository keys = mock(ApiKeyRepository.class);
        RateClientRepository clients = mock(RateClientRepository.class);
        ApiKey key = new ApiKey(); key.setName("old"); key.setKeyValue("rl_secret"); key.setStatus("ACTIVE");
        ReflectionTestUtils.setField(key, "createdAt", LocalDateTime.now());
        when(keys.findByIdAndOwnerUsername(1L, "owner@example.com")).thenReturn(Optional.of(key)); when(keys.save(key)).thenReturn(key);
        ApiKeyCreateRequest request = new ApiKeyCreateRequest(); request.setName("new");

        var response = new AccessService(keys, clients).updateKey(1L, request, "owner@example.com");

        assertEquals("new", response.getName());
        assertEquals("rl_secre******", response.getMaskedKey());
    }
}