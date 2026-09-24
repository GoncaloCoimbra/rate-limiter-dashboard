package com.company.ratelimiter.access.controller;

import com.company.ratelimiter.access.dto.*;
import com.company.ratelimiter.access.service.AccessService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api")
public class AccessController {
    private final AccessService accessService;
    public AccessController(AccessService accessService) { this.accessService = accessService; }
    @GetMapping("/keys") public List<ApiKeyResponse> keys(Authentication authentication) { return accessService.listKeys(authentication.getName()); }
    @PostMapping("/keys") @ResponseStatus(HttpStatus.CREATED) public ApiKeyResponse createKey(@Valid @RequestBody ApiKeyCreateRequest request, Authentication authentication) { return accessService.createKey(request, authentication.getName()); }
    @PutMapping("/keys/{id}") public ApiKeyResponse updateKey(@PathVariable Long id, @Valid @RequestBody ApiKeyCreateRequest request, Authentication authentication) { return accessService.updateKey(id, request, authentication.getName()); }
    @PostMapping("/keys/{id}/revoke") public ApiKeyResponse revokeKey(@PathVariable Long id, Authentication authentication) { return accessService.revokeKey(id, authentication.getName()); }
    @DeleteMapping("/keys/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteKey(@PathVariable Long id, Authentication authentication) { accessService.deleteKey(id, authentication.getName()); }
    @GetMapping("/clients") public List<ClientResponse> clients() { return accessService.listClients(); }
    @PostMapping("/clients") @ResponseStatus(HttpStatus.CREATED) public ClientResponse createClient(@Valid @RequestBody AccessCreateRequest request) { return accessService.createClient(request); }
    @PutMapping("/clients/{id}") public ClientResponse updateClient(@PathVariable Long id, @Valid @RequestBody AccessCreateRequest request) { return accessService.updateClient(id, request); }
    @DeleteMapping("/clients/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteClient(@PathVariable Long id) { accessService.deleteClient(id); }
}