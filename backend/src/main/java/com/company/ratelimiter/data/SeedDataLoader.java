package com.company.ratelimiter.data;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.company.ratelimiter.event.entity.RateLimitEvent;
import com.company.ratelimiter.event.repository.EventRepository;
import com.company.ratelimiter.policy.entity.EnvironmentType;
import com.company.ratelimiter.policy.entity.PolicyAlgorithm;
import com.company.ratelimiter.policy.entity.PolicyStatus;
import com.company.ratelimiter.policy.entity.PolicyWindow;
import com.company.ratelimiter.policy.entity.RatePolicy;
import com.company.ratelimiter.policy.entity.ScopeType;
import com.company.ratelimiter.policy.repository.PolicyRepository;

@Component
@Profile("dev")
public class SeedDataLoader implements ApplicationRunner {

    private final PolicyRepository policyRepository;
    private final EventRepository eventRepository;

    public SeedDataLoader(PolicyRepository policyRepository, EventRepository eventRepository) {
        this.policyRepository = policyRepository;
        this.eventRepository = eventRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (policyRepository.count() > 0) {
            return;
        }

        RatePolicy primaryPolicy = new RatePolicy();
        primaryPolicy.setName("API default");
        primaryPolicy.setOwnerUsername("admin");
        primaryPolicy.setDescription("Default user-facing API policy");
        primaryPolicy.setAlgorithm(PolicyAlgorithm.TOKEN_BUCKET);
        primaryPolicy.setLimit(120);
        primaryPolicy.setWindow(PolicyWindow.MINUTE);
        primaryPolicy.setScope(ScopeType.IP_ADDRESS);
        primaryPolicy.setStatus(PolicyStatus.ACTIVE);
        primaryPolicy.setUsage(72);
        primaryPolicy.setEnvironment(EnvironmentType.PRODUCTION);
        primaryPolicy.setBurst(30);
        policyRepository.save(primaryPolicy);

        RatePolicy strictPolicy = new RatePolicy();
        strictPolicy.setName("Strict admin guard");
        strictPolicy.setOwnerUsername("admin");
        strictPolicy.setDescription("Strong control imposed on admin endpoints");
        strictPolicy.setAlgorithm(PolicyAlgorithm.FIXED_WINDOW);
        strictPolicy.setLimit(30);
        strictPolicy.setWindow(PolicyWindow.HOUR);
        strictPolicy.setScope(ScopeType.USER);
        strictPolicy.setStatus(PolicyStatus.PAUSED);
        strictPolicy.setUsage(15);
        strictPolicy.setEnvironment(EnvironmentType.STAGING);
        strictPolicy.setBurst(10);
        policyRepository.save(strictPolicy);

        RateLimitEvent event1 = new RateLimitEvent();
        event1.setOccurredAt(System.currentTimeMillis() - 120000L);
        event1.setOwnerUsername("admin");
        event1.setReason("too many requests");
        event1.setEndpoint("/api/orders");
        event1.setStatus("BLOCKED");
        event1.setIpAddress("10.0.0.12");
        event1.setPolicyId(primaryPolicy.getId());
        eventRepository.save(event1);

        RateLimitEvent event2 = new RateLimitEvent();
        event2.setOccurredAt(System.currentTimeMillis() - 60000L);
        event2.setOwnerUsername("admin");
        event2.setReason("burst limit reached");
        event2.setEndpoint("/api/search");
        event2.setStatus("ALLOWED");
        event2.setIpAddress("10.0.0.19");
        event2.setPolicyId(strictPolicy.getId());
        eventRepository.save(event2);
    }
}
