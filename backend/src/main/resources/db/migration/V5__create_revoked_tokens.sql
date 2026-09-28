CREATE TABLE revoked_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    jti VARCHAR(80) NOT NULL UNIQUE,
    expires_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX idx_revoked_tokens_expiry ON revoked_tokens (expires_at);