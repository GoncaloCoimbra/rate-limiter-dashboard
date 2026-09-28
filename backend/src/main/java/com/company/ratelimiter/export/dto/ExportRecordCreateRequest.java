package com.company.ratelimiter.export.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public class ExportRecordCreateRequest {
    @NotBlank
    private String fileName;

    @NotNull
    @PositiveOrZero
    private Integer rowCount;

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public Integer getRowCount() { return rowCount; }
    public void setRowCount(Integer rowCount) { this.rowCount = rowCount; }
}
