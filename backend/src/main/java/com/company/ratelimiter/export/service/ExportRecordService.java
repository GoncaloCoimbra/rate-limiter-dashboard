package com.company.ratelimiter.export.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ratelimiter.export.dto.ExportRecordCreateRequest;
import com.company.ratelimiter.export.dto.ExportRecordResponse;
import com.company.ratelimiter.export.entity.ExportRecord;
import com.company.ratelimiter.export.repository.ExportRecordRepository;

@Service
public class ExportRecordService {
    private final ExportRecordRepository repository;

    public ExportRecordService(ExportRecordRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ExportRecordResponse> list(String ownerUsername) {
        return repository.findAllByOwnerUsername(ownerUsername).stream()
                .map(ExportRecordResponse::from)
                .toList();
    }

    @Transactional
    public ExportRecordResponse create(ExportRecordCreateRequest request, String ownerUsername) {
        ExportRecord record = new ExportRecord();
        record.setFileName(request.getFileName().trim());
        record.setRowCount(request.getRowCount());
        record.setOwnerUsername(ownerUsername);
        return ExportRecordResponse.from(repository.save(record));
    }
}
