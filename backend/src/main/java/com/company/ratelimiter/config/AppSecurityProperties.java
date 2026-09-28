package com.company.ratelimiter.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

import jakarta.annotation.PostConstruct;

@ConfigurationProperties(prefix = "app.security")
public class AppSecurityProperties {
    private static final String INSECURE_DEFAULT_SECRET = "change-this-development-secret-please-rotate";
    private static final String INSECURE_DEFAULT_PASSWORD = "change-me";
    private static final String INSECURE_DEFAULT_DB_PASSWORD = "root";

    private boolean requireAuth;
    private String username = "admin";
    private String password = "change-me";
    private String jwtSecret;
    private long jwtExpirationMs = 3_600_000L;
    private String corsAllowedOrigins = "http://localhost:4200,http://127.0.0.1:4200";
    private Environment environment;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;
    @Value("${spring.datasource.username:}")
    private String datasourceUsername;
    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    public AppSecurityProperties() {
    }

    public AppSecurityProperties(Environment environment) {
        this.environment = environment;
    }

    @Autowired
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validate() {
        boolean isDevProfile = environment != null && environment.acceptsProfiles(Profiles.of("dev"));
        boolean isTestProfile = environment != null && environment.acceptsProfiles(Profiles.of("test"));

        boolean isEmbeddedOrContainerizedTestDatabase = datasourceUrl != null && (
                datasourceUrl.startsWith("jdbc:h2:")
                        || datasourceUrl.startsWith("jdbc:tc:")
                        || datasourceUrl.contains("testcontainers")
        );

        if (isDevProfile || isTestProfile || isEmbeddedOrContainerizedTestDatabase) {
            return;
        }

        String normalizedUsername = username == null ? "" : username.trim();
        String normalizedPassword = password == null ? "" : password.trim();
        String normalizedJwtSecret = jwtSecret == null ? "" : jwtSecret.trim();

        boolean usesDefaultJwtSecret = INSECURE_DEFAULT_SECRET.equals(normalizedJwtSecret)
                || normalizedJwtSecret.isEmpty()
                || normalizedJwtSecret.length() < 32;
        boolean usesDefaultPassword = INSECURE_DEFAULT_PASSWORD.equals(normalizedPassword)
                || normalizedPassword.isEmpty();
        boolean usesDefaultAdminUser = "admin".equals(normalizedUsername) && usesDefaultPassword;
        boolean usesDefaultLocalMySql = "jdbc:mysql://localhost:3308/rate_limiter".equals(datasourceUrl);
        boolean usesDefaultDatabaseCredentials = "root".equals(datasourceUsername)
                || INSECURE_DEFAULT_DB_PASSWORD.equals(datasourcePassword);

        if (usesDefaultJwtSecret
                || usesDefaultPassword
                || usesDefaultAdminUser
                || usesDefaultLocalMySql
                || usesDefaultDatabaseCredentials) {
            throw new IllegalStateException(
                "Configuração insegura detectada fora do profile dev. Defina credentials e secret reais para username admin, password admin e JWT secret.");
        }
    }

    public boolean isRequireAuth() { return requireAuth; }
    public void setRequireAuth(boolean requireAuth) { this.requireAuth = requireAuth; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getJwtSecret() { return jwtSecret; }
    public void setJwtSecret(String jwtSecret) { this.jwtSecret = jwtSecret; }
    public long getJwtExpirationMs() { return jwtExpirationMs; }
    public void setJwtExpirationMs(long jwtExpirationMs) { this.jwtExpirationMs = jwtExpirationMs; }
    public String getCorsAllowedOrigins() { return corsAllowedOrigins; }
    public void setCorsAllowedOrigins(String corsAllowedOrigins) { this.corsAllowedOrigins = corsAllowedOrigins; }
    public String getDatasourceUrl() { return datasourceUrl; }
    public void setDatasourceUrl(String datasourceUrl) { this.datasourceUrl = datasourceUrl; }
    public String getDatasourceUsername() { return datasourceUsername; }
    public void setDatasourceUsername(String datasourceUsername) { this.datasourceUsername = datasourceUsername; }
    public String getDatasourcePassword() { return datasourcePassword; }
    public void setDatasourcePassword(String datasourcePassword) { this.datasourcePassword = datasourcePassword; }
}
