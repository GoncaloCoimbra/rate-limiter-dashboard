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

	@Query(value = "select floor(occurred_at / :bucketMillis) * :bucketMillis as bucketStart, "
			+ "sum(case when status = 'ALLOWED' then 1 else 0 end) as allowedRequests, "
			+ "sum(case when status = 'BLOCKED' then 1 else 0 end) as blockedRequests "
			+ "from rate_limit_events where owner_username = :ownerUsername "
			+ "and occurred_at >= :from and occurred_at <= :to "
			+ "group by bucketStart order by bucketStart", nativeQuery = true)
	List<TrafficBucketProjection> findTrafficBuckets(@Param("ownerUsername") String ownerUsername,
			@Param("from") long from,
			@Param("to") long to,
			@Param("bucketMillis") long bucketMillis);

	@Query("select event.endpoint as endpoint, count(event) as requestCount, "
			+ "sum(case when event.status = 'BLOCKED' then 1L else 0L end) as blockedRequests "
			+ "from RateLimitEvent event where event.ownerUsername = :ownerUsername "
			+ "and event.occurredAt >= :from and event.occurredAt <= :to "
			+ "group by event.endpoint order by count(event) desc")
	List<EndpointActivityProjection> findEndpointActivity(@Param("ownerUsername") String ownerUsername,
			@Param("from") long from,
			@Param("to") long to,
			Pageable pageable);
}
