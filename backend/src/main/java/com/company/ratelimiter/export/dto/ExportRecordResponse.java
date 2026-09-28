package com.company.ratelimiter.export.dto;

import java.time.LocalDateTime;

import com.company.ratelimiter.export.entity.ExportRecord;

public record ExportRecordResponse(Long id, String fileName, Integer rowCount, LocalDateTime createdAt) {
    public static ExportRecordResponse from(ExportRecord record) {
        return new ExportRecordResponse(record.getId(), record.getFileName(), record.getRowCount(), record.getCreatedAt());
    }
}
