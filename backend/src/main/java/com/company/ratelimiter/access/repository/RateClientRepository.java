package com.company.ratelimiter.access.repository;

import com.company.ratelimiter.access.entity.RateClient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RateClientRepository extends JpaRepository<RateClient, Long> { }