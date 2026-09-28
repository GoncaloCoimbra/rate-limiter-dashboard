package com.company.ratelimiter.ratelimit.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.company.ratelimiter.access.entity.ApiKey;
import com.company.ratelimiter.access.repository.ApiKeyRepository;
import com.company.ratelimiter.event.repository.EventRepository;
import com.company.ratelimiter.policy.entity.EnvironmentType;
import com.company.ratelimiter.policy.entity.PolicyAlgorithm;
import com.company.ratelimiter.policy.entity.PolicyStatus;
import com.company.ratelimiter.policy.entity.PolicyWindow;
import com.company.ratelimiter.policy.entity.RatePolicy;
import com.company.ratelimiter.policy.entity.ScopeType;
import com.company.ratelimiter.policy.repository.PolicyRepository;
import com.company.ratelimiter.ratelimit.repository.RateLimitStateRepository;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class RateLimitEnforcementFilterIntegrationTest {

        @Container
        private static final MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4")
                        .withDatabaseName("rate_limiter")
                        .withUsername("rate_limiter")
                        .withPassword("rate_limiter");

        @DynamicPropertySource
        static void configureDataSource(DynamicPropertyRegistry registry) {
                registry.add("spring.datasource.url", mysql::getJdbcUrl);
                registry.add("spring.datasource.username", mysql::getUsername);
                registry.add("spring.datasource.password", mysql::getPassword);
                registry.add("spring.datasource.driver-class-name", mysql::getDriverClassName);
                registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
                registry.add("spring.flyway.enabled", () -> true);
                registry.add("app.security.username", () -> "admin");
                registry.add("app.security.password", () -> "ci-admin-password");
                registry.add("app.security.jwt-secret", () -> "ci-only-secret-with-at-least-32-characters");
        }

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ApiKeyRepository apiKeyRepository;

        @Autowired
        private PolicyRepository policyRepository;

        @Autowired
        private EventRepository eventRepository;

        @Autowired
        private RateLimitStateRepository stateRepository;

        private static ExecutorService executor;
        private String apiKeyValue;

        @BeforeAll
        static void createExecutor() {
                executor = Executors.newFixedThreadPool(20);
        }

        @AfterAll
        static void shutdownExecutor() {
                executor.shutdownNow();
        }

        @BeforeEach
        void createApiKeyAndPolicy() {
                stateRepository.deleteAll();
                eventRepository.deleteAll();
                apiKeyRepository.deleteAll();
                policyRepository.deleteAll();

                RatePolicy policy = new RatePolicy();
                policy.setOwnerUsername("admin");
                policy.setName("Public ping policy");
                policy.setDescription("MySQL concurrency integration policy");
                policy.setAlgorithm(PolicyAlgorithm.FIXED_WINDOW);
                policy.setLimit(5);
                policy.setWindow(PolicyWindow.MINUTE);
                policy.setScope(ScopeType.API_KEY);
                policy.setStatus(PolicyStatus.ACTIVE);
                policy.setUsage(0);
                policy.setEnvironment(EnvironmentType.DEVELOPMENT);
                policy.setBurst(0);
                policy = policyRepository.saveAndFlush(policy);

                apiKeyValue = "rl_test_" + UUID.randomUUID().toString().replace("-", "");
                ApiKey apiKey = new ApiKey();
                apiKey.setOwnerUsername("admin");
                apiKey.setName("MySQL concurrency test key");
                apiKey.setKeyValue(apiKeyValue);
                apiKey.setStatus("ACTIVE");
                apiKey.setRatePolicy(policy);
                apiKeyRepository.saveAndFlush(apiKey);
        }

        @Test
        void permitsExactlyTheConfiguredNumberAndPersistsEveryDecision() throws Exception {
                int requestCount = 20;
                CountDownLatch start = new CountDownLatch(1);
                List<CompletableFuture<MvcResult>> requests = new ArrayList<>();

                for (int index = 0; index < requestCount; index++) {
                        requests.add(CompletableFuture.supplyAsync(() -> {
                                await(start);
                                try {
                                        return mockMvc.perform(get("/api/public/ping")
                                                                        .header("X-API-Key", apiKeyValue))
                                                        .andReturn();
                                } catch (Exception exception) {
                                        throw new IllegalStateException(exception);
                                }
                        }, executor));
                }

                start.countDown();
                List<MvcResult> results = requests.stream().map(CompletableFuture::join).toList();
                long allowed = results.stream().filter(result -> result.getResponse().getStatus() == 200).count();
                long blocked = results.stream().filter(result -> result.getResponse().getStatus() == 429).count();

                assertThat(allowed).isEqualTo(5);
                assertThat(blocked).isEqualTo(15);
                assertThat(results).allMatch(result -> result.getResponse().getHeader("X-RateLimit-Limit").equals("5"));
                assertThat(results.stream()
                                .filter(result -> result.getResponse().getStatus() == 429)
                                .allMatch(result -> result.getResponse().getHeader("Retry-After") != null
                                                && result.getResponse().getHeader("X-RateLimit-Remaining").equals("0")
                                                && result.getResponse().getHeader("X-RateLimit-Reset") != null))
                                .isTrue();

                assertThat(eventRepository.findAll()).hasSize(requestCount);
                assertThat(eventRepository.findAll().stream().filter(event -> "ALLOWED".equals(event.getStatus())).count()).isEqualTo(5);
                assertThat(eventRepository.findAll().stream().filter(event -> "BLOCKED".equals(event.getStatus())).count()).isEqualTo(15);
                assertThat(eventRepository.findAll()).allMatch(event -> "admin".equals(event.getOwnerUsername()));
        }

        private static void await(CountDownLatch start) {
                try {
                        start.await();
                } catch (InterruptedException exception) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException(exception);
                }
        }
}
