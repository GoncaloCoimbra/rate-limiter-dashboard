package com.company.ratelimiter.endpoint.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

import com.company.ratelimiter.endpoint.dto.EndpointSummaryDto;
import com.company.ratelimiter.endpoint.service.EndpointService;

@RestController
@RequestMapping("/api/endpoints")
public class EndpointController {

    private final EndpointService endpointService;

    public EndpointController(EndpointService endpointService) {
        this.endpointService = endpointService;
    }

    @GetMapping
    public List<EndpointSummaryDto> listEndpoints(Authentication authentication) {
        return endpointService.listSummaries(authentication.getName());
    }
}