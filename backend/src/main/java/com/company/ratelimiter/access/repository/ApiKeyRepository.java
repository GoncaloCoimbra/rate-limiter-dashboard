package com.company.ratelimiter.access.repository;

import com.company.ratelimiter.access.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
	List<ApiKey> findAllByOwnerUsername(String ownerUsername);
	Optional<ApiKey> findByIdAndOwnerUsername(Long id, String ownerUsername);
}