package com.company.ratelimiter.export.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "export_records")
public class ExportRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "owner_username", nullable = false, length = 160) private String ownerUsername;
    @Column(nullable = false, length = 120) private String fileName;
    @Column(nullable = false) private Integer rowCount;
    @Column(nullable = false) private LocalDateTime createdAt;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
    public Long getId() { return id; }
    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public Integer getRowCount() { return rowCount; }
    public void setRowCount(Integer rowCount) { this.rowCount = rowCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}