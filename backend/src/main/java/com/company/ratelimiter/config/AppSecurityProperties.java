package com.company.ratelimiter.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import jakarta.annotation.PostConstruct;

@ConfigurationProperties(prefix = "app.security")
public class AppSecurityProperties {
    private static final String INSECURE_DEFAULT_SECRET = "change-this-development-secret-please-rotate";

    private boolean requireAuth;
    private String username = "admin";
    private String password = "change-me";
    private String jwtSecret;
    private long jwtExpirationMs = 3_600_000L;
    private String corsAllowedOrigins = "http://localhost:4200,http://127.0.0.1:4200";

    @PostConstruct
    void validate() {
        if (requireAuth && INSECURE_DEFAULT_SECRET.equals(jwtSecret)) {
            throw new IllegalStateException(
                "app.security.jwt-secret está com o valor default de desenvolvimento. "
                + "Define APP_SECURITY_JWT_SECRET antes de arrancar em produção.");
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
}