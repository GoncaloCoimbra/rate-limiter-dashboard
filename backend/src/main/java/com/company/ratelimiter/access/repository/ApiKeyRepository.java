package com.company.ratelimiter.access.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.company.ratelimiter.access.entity.ApiKey;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
	@EntityGraph(attributePaths = "ratePolicy")
	List<ApiKey> findAllByOwnerUsername(String ownerUsername);
	@EntityGraph(attributePaths = "ratePolicy")
	List<ApiKey> findAllByStatus(String status);
	Optional<ApiKey> findByIdAndOwnerUsername(Long id, String ownerUsername);
	@EntityGraph(attributePaths = "ratePolicy")
	Optional<ApiKey> findByKeyValueAndStatus(String keyValue, String status);
}