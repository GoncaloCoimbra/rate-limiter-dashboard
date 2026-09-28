package com.company.ratelimiter.export.controller;

import com.company.ratelimiter.export.dto.ExportRecordCreateRequest;
import com.company.ratelimiter.export.dto.ExportRecordResponse;
import com.company.ratelimiter.export.service.ExportRecordService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/exports")
public class ExportRecordController {
    private final ExportRecordService service;
    public ExportRecordController(ExportRecordService service) { this.service = service; }
    @GetMapping public List<ExportRecordResponse> list(Authentication authentication) { return service.list(authentication.getName()); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ExportRecordResponse create(@Valid @RequestBody ExportRecordCreateRequest request, Authentication authentication) {
        return service.create(request, authentication.getName());
    }
}