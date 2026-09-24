package com.company.ratelimiter.export.repository;

import com.company.ratelimiter.export.entity.ExportRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExportRecordRepository extends JpaRepository<ExportRecord, Long> {
	List<ExportRecord> findAllByOwnerUsername(String ownerUsername);
}