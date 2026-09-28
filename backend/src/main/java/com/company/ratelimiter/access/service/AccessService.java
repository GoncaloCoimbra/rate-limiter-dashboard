package com.company.ratelimiter.access.service;

import com.company.ratelimiter.access.dto.*;
import com.company.ratelimiter.access.entity.ApiKey;
import com.company.ratelimiter.access.entity.RateClient;
import com.company.ratelimiter.access.repository.ApiKeyRepository;
import com.company.ratelimiter.access.repository.RateClientRepository;
import com.company.ratelimiter.common.InvalidDomainStateException;
import com.company.ratelimiter.common.ResourceNotFoundException;
import com.company.ratelimiter.policy.entity.PolicyStatus;
import com.company.ratelimiter.policy.entity.RatePolicy;
import com.company.ratelimiter.policy.repository.PolicyRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Objects;

@Service
public class AccessService {
    private final ApiKeyRepository apiKeyRepository;
    private final RateClientRepository clientRepository;
    private final PolicyRepository policyRepository;

    public AccessService(ApiKeyRepository apiKeyRepository, RateClientRepository clientRepository, PolicyRepository policyRepository) {
        this.apiKeyRepository = apiKeyRepository;
        this.clientRepository = clientRepository;
        this.policyRepository = policyRepository;
    }

    public List<ApiKeyResponse> listKeys(String ownerUsername) { return apiKeyRepository.findAllByOwnerUsername(ownerUsername).stream().map(this::keyResponse).toList(); }
    public ApiKeyResponse createKey(ApiKeyCreateRequest request, String ownerUsername) {
        String name = sanitizeName(request.getName(), "API key name");
        String rawKey = generateSecureApiKey();
        ApiKey key = new ApiKey(); key.setName(name); key.setStatus("ACTIVE");
        key.setOwnerUsername(ownerUsername);
        key.setRatePolicy(resolvePolicy(request.getPolicyId(), ownerUsername));
        key.setKeyPrefix(extractKeyPrefix(rawKey));
        key.setKeyValue(hashValue(rawKey));
        ApiKeyResponse response = keyResponse(apiKeyRepository.save(key), rawKey);
        response.setKey(rawKey);
        return response;
    }
    public ApiKeyResponse updateKey(Long id, ApiKeyCreateRequest request, String ownerUsername) {
        ApiKey key = apiKeyRepository.findByIdAndOwnerUsername(Objects.requireNonNull(id), ownerUsername).orElseThrow(() -> new IllegalArgumentException("Key not found: " + id));
        key.setName(sanitizeName(request.getName(), "API key name"));
        if (request.getPolicyId() != null) key.setRatePolicy(resolvePolicy(request.getPolicyId(), ownerUsername));
        return keyResponse(apiKeyRepository.save(key));
    }
    public ApiKeyResponse revokeKey(Long id, String ownerUsername) {
        ApiKey key = apiKeyRepository.findByIdAndOwnerUsername(Objects.requireNonNull(id), ownerUsername).orElseThrow(() -> new IllegalArgumentException("Key not found: " + id));
        key.setStatus("REVOKED");
        return keyResponse(apiKeyRepository.save(key));
    }
    public void deleteKey(Long id, String ownerUsername) { apiKeyRepository.delete(apiKeyRepository.findByIdAndOwnerUsername(Objects.requireNonNull(id), ownerUsername).orElseThrow(() -> new IllegalArgumentException("Key not found: " + id))); }

    private RatePolicy resolvePolicy(Long policyId, String ownerUsername) {
        if (policyId == null) throw new IllegalArgumentException("A rate policy is required");
        RatePolicy policy = policyRepository.findByIdAndOwnerUsername(policyId, ownerUsername)
                .orElseThrow(() -> new IllegalArgumentException("Policy not found: " + policyId));
        if (policy.getStatus() != PolicyStatus.ACTIVE) {
            throw new InvalidDomainStateException("Policy is not active and cannot be used for a new API key");
        }
        return policy;
    }

    private String sanitizeName(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value.trim();
    }

    private String generateSecureApiKey() {
        byte[] random = new byte[24];
        new SecureRandom().nextBytes(random);
        return "rl_" + Base64.getUrlEncoder().withoutPadding().encodeToString(random);
    }

    private static String extractKeyPrefix(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.substring(0, Math.min(8, value.length()));
    }

    private static String hashValue(String value) {
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

    public List<ClientResponse> listClients(String ownerUsername) { return clientRepository.findAllByOwnerUsername(ownerUsername).stream().map(this::clientResponse).toList(); }
    public ClientResponse getClient(Long id, String ownerUsername) {
        return clientRepository.findByIdAndOwnerUsername(Objects.requireNonNull(id), ownerUsername)
                .map(this::clientResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + id));
    }
    public ClientResponse createClient(AccessCreateRequest request, String ownerUsername) {
        RateClient client = new RateClient(); client.setName(request.getName()); client.setIdentifier(request.getIdentifier()); client.setStatus("ACTIVE"); client.setOwnerUsername(ownerUsername);
        return clientResponse(clientRepository.save(client));
    }
    public ClientResponse updateClient(Long id, AccessCreateRequest request, String ownerUsername) {
        RateClient client = clientRepository.findByIdAndOwnerUsername(Objects.requireNonNull(id), ownerUsername).orElseThrow(() -> new ResourceNotFoundException("Client not found: " + id));
        client.setName(request.getName()); client.setIdentifier(request.getIdentifier());
        return clientResponse(clientRepository.save(client));
    }
    public void deleteClient(Long id, String ownerUsername) { clientRepository.delete(clientRepository.findByIdAndOwnerUsername(Objects.requireNonNull(id), ownerUsername).orElseThrow(() -> new ResourceNotFoundException("Client not found: " + id))); }

    private ApiKeyResponse keyResponse(ApiKey key) {
        return keyResponse(key, null);
    }

    private ApiKeyResponse keyResponse(ApiKey key, String rawKey) {
        ApiKeyResponse response = new ApiKeyResponse();
        response.setId(key.getId());
        response.setName(key.getName());

        String keyPrefix = key.getKeyPrefix();
        if (keyPrefix != null && !keyPrefix.isBlank()) {
            response.setMaskedKey(keyPrefix + "******");
        } else {
            response.setMaskedKey("********");
        }

        response.setStatus(key.getStatus());
        response.setCreatedAt(key.getCreatedAt() == null ? null : key.getCreatedAt().toString());
        return response;
    }
    private ClientResponse clientResponse(RateClient client) {
        ClientResponse response = new ClientResponse(); response.setId(client.getId()); response.setName(client.getName());
        response.setIdentifier(client.getIdentifier()); response.setStatus(client.getStatus()); response.setCreatedAt(client.getCreatedAt().toString()); return response;
    }
}