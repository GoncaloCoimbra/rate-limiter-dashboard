package com.company.ratelimiter.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class AppSecurityPropertiesTest {

    @Test
    void rejectsInsecureDefaultsOutsideDev() {
        AppSecurityProperties properties = defaults(new MockEnvironment());

        assertThrows(IllegalStateException.class, properties::validate);
    }

    @Test
    void rejectsUnsafeDefaultAdminCredentialsOutsideDev() {
        MockEnvironment environment = new MockEnvironment();
        AppSecurityProperties properties = defaults(environment);
        properties.setUsername("admin");
        properties.setPassword("change-me");
        properties.setJwtSecret("real-production-secret-not-default");

        assertThrows(IllegalStateException.class, properties::validate);
    }

    @Test
    void allowsDevelopmentDefaultsInDevProfile() {
        MockEnvironment environment = new MockEnvironment().withProperty("spring.profiles.active", "dev");
        AppSecurityProperties properties = defaults(environment);

        assertDoesNotThrow(properties::validate);
    }

    @Test
    void allowsH2TestDatabaseDefaults() {
        MockEnvironment environment = new MockEnvironment();
        AppSecurityProperties properties = defaults(environment);
        properties.setUsername("admin");
        properties.setPassword("change-me");
        properties.setJwtSecret("change-this-development-secret-please-rotate");

        properties.setDatasourceUrl("jdbc:h2:mem:testdb;MODE=MySQL");
        properties.setDatasourceUsername("sa");
        properties.setDatasourcePassword("sa");

        assertDoesNotThrow(properties::validate);
    }

    private AppSecurityProperties defaults(MockEnvironment environment) {
        AppSecurityProperties properties = new AppSecurityProperties(environment);
        properties.setUsername("admin");
        properties.setPassword("change-me");
        properties.setJwtSecret("change-this-development-secret-please-rotate");
        return properties;
    }
}
