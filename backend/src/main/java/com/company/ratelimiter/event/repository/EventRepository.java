package com.company.ratelimiter.event.repository;

import com.company.ratelimiter.event.entity.RateLimitEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EventRepository extends JpaRepository<RateLimitEvent, Long> {
	List<RateLimitEvent> findAllByOwnerUsername(String ownerUsername);
	Page<RateLimitEvent> findAllByOwnerUsername(String ownerUsername, Pageable pageable);

	@Query("select count(event) from RateLimitEvent event where event.ownerUsername = :ownerUsername and event.status = :status and (:from is null or event.occurredAt >= :from) and (:to is null or event.occurredAt <= :to)")
	long countByOwnerAndStatusAndPeriod(@Param("ownerUsername") String ownerUsername,
										@Param("status") String status,
										@Param("from") Long from,
										@Param("to") Long to);
}
