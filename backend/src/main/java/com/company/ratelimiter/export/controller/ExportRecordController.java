package com.company.ratelimiter.export.controller;

import com.company.ratelimiter.export.entity.ExportRecord;
import com.company.ratelimiter.export.repository.ExportRecordRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/exports")
public class ExportRecordController {
    private final ExportRecordRepository repository;
    public ExportRecordController(ExportRecordRepository repository) { this.repository = repository; }
    @GetMapping public List<ExportRecord> list(Authentication authentication) { return repository.findAllByOwnerUsername(authentication.getName()); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ExportRecord create(@RequestBody ExportRecord request, Authentication authentication) {
        ExportRecord record = new ExportRecord(); record.setFileName(request.getFileName()); record.setRowCount(request.getRowCount()); record.setOwnerUsername(authentication.getName()); return repository.save(record);
    }
}