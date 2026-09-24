package com.company.ratelimiter.policy.repository;

import com.company.ratelimiter.policy.entity.RatePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PolicyRepository extends JpaRepository<RatePolicy, Long> {
	long countByOwnerUsername(String ownerUsername);
	List<RatePolicy> findAllByOwnerUsername(String ownerUsername);
	Page<RatePolicy> findAllByOwnerUsername(String ownerUsername, Pageable pageable);
	Optional<RatePolicy> findByIdAndOwnerUsername(Long id, String ownerUsername);
}
