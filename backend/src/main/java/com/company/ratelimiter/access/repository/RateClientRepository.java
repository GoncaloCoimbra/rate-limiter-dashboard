package com.company.ratelimiter.access.repository;

import com.company.ratelimiter.access.entity.RateClient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RateClientRepository extends JpaRepository<RateClient, Long> {
	List<RateClient> findAllByOwnerUsername(String ownerUsername);
	Optional<RateClient> findByIdAndOwnerUsername(Long id, String ownerUsername);
}