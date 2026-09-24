package com.company.ratelimiter.access.service;

import com.company.ratelimiter.access.dto.*;
import com.company.ratelimiter.access.entity.ApiKey;
import com.company.ratelimiter.access.entity.RateClient;
import com.company.ratelimiter.access.repository.ApiKeyRepository;
import com.company.ratelimiter.access.repository.RateClientRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.Objects;

@Service
public class AccessService {
    private final ApiKeyRepository apiKeyRepository;
    private final RateClientRepository clientRepository;

    public AccessService(ApiKeyRepository apiKeyRepository, RateClientRepository clientRepository) {
        this.apiKeyRepository = apiKeyRepository;
        this.clientRepository = clientRepository;
    }

    public List<ApiKeyResponse> listKeys(String ownerUsername) { return apiKeyRepository.findAllByOwnerUsername(ownerUsername).stream().map(this::keyResponse).toList(); }
    public ApiKeyResponse createKey(ApiKeyCreateRequest request, String ownerUsername) {
        ApiKey key = new ApiKey(); key.setName(request.getName()); key.setStatus("ACTIVE");
        key.setOwnerUsername(ownerUsername);
        key.setKeyValue("rl_" + UUID.randomUUID().toString().replace("-", ""));
        return keyResponse(apiKeyRepository.save(key));
    }
    public ApiKeyResponse updateKey(Long id, ApiKeyCreateRequest request, String ownerUsername) {
        ApiKey key = apiKeyRepository.findByIdAndOwnerUsername(Objects.requireNonNull(id), ownerUsername).orElseThrow(() -> new IllegalArgumentException("Key not found: " + id));
        key.setName(request.getName());
        return keyResponse(apiKeyRepository.save(key));
    }
    public ApiKeyResponse revokeKey(Long id, String ownerUsername) {
        ApiKey key = apiKeyRepository.findByIdAndOwnerUsername(Objects.requireNonNull(id), ownerUsername).orElseThrow(() -> new IllegalArgumentException("Key not found: " + id));
        key.setStatus("REVOKED");
        return keyResponse(apiKeyRepository.save(key));
    }
    public void deleteKey(Long id, String ownerUsername) { apiKeyRepository.delete(apiKeyRepository.findByIdAndOwnerUsername(Objects.requireNonNull(id), ownerUsername).orElseThrow(() -> new IllegalArgumentException("Key not found: " + id))); }
    public List<ClientResponse> listClients() { return clientRepository.findAll().stream().map(this::clientResponse).toList(); }
    public ClientResponse createClient(AccessCreateRequest request) {
        RateClient client = new RateClient(); client.setName(request.getName()); client.setIdentifier(request.getIdentifier()); client.setStatus("ACTIVE");
        return clientResponse(clientRepository.save(client));
    }
    public ClientResponse updateClient(Long id, AccessCreateRequest request) {
        RateClient client = clientRepository.findById(Objects.requireNonNull(id)).orElseThrow(() -> new IllegalArgumentException("Client not found: " + id));
        client.setName(request.getName()); client.setIdentifier(request.getIdentifier());
        return clientResponse(clientRepository.save(client));
    }
    public void deleteClient(Long id) { clientRepository.deleteById(Objects.requireNonNull(id)); }

    private ApiKeyResponse keyResponse(ApiKey key) {
        ApiKeyResponse response = new ApiKeyResponse(); response.setId(key.getId()); response.setName(key.getName());
        String value = key.getKeyValue(); response.setMaskedKey(value.substring(0, Math.min(8, value.length())) + "******");
        response.setStatus(key.getStatus()); response.setCreatedAt(key.getCreatedAt().toString()); return response;
    }
    private ClientResponse clientResponse(RateClient client) {
        ClientResponse response = new ClientResponse(); response.setId(client.getId()); response.setName(client.getName());
        response.setIdentifier(client.getIdentifier()); response.setStatus(client.getStatus()); response.setCreatedAt(client.getCreatedAt().toString()); return response;
    }
}