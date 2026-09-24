CREATE TABLE app_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(160) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL
);

CREATE TABLE rate_policies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_username VARCHAR(160) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    algorithm ENUM('FIXED_WINDOW', 'SLIDING_WINDOW', 'TOKEN_BUCKET') NOT NULL,
    request_limit INT NOT NULL,
    window_unit ENUM('DAY', 'HOUR', 'MINUTE', 'SECOND') NOT NULL,
    scope ENUM('API_KEY', 'IP_ADDRESS', 'USER') NOT NULL,
    status ENUM('ACTIVE', 'PAUSED') NOT NULL,
    usage_count INT NOT NULL,
    environment ENUM('DEVELOPMENT', 'PRODUCTION', 'STAGING') NOT NULL,
    burst INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL
);

CREATE TABLE api_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_username VARCHAR(160) NOT NULL,
    name VARCHAR(120) NOT NULL,
    key_value VARCHAR(80) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL
);

CREATE TABLE rate_clients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    identifier VARCHAR(120) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL
);

CREATE TABLE rate_limit_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_username VARCHAR(160) NOT NULL,
    occurred_at BIGINT NOT NULL,
    reason VARCHAR(64) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    policy_id BIGINT,
    created_at DATETIME(6) NOT NULL
);

CREATE TABLE rate_limit_state (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    state_key VARCHAR(255) NOT NULL UNIQUE,
    state TEXT NOT NULL
);

CREATE TABLE export_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_username VARCHAR(160) NOT NULL,
    file_name VARCHAR(120) NOT NULL,
    row_count INT NOT NULL,
    created_at DATETIME(6) NOT NULL
);

CREATE TABLE dashboard_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(80) NOT NULL UNIQUE,
    setting_value VARCHAR(255) NOT NULL
);

CREATE INDEX idx_rate_policies_owner ON rate_policies (owner_username);
CREATE INDEX idx_api_keys_owner ON api_keys (owner_username);
CREATE INDEX idx_events_owner_time ON rate_limit_events (owner_username, occurred_at);
CREATE INDEX idx_events_owner_status_time ON rate_limit_events (owner_username, status, occurred_at);
CREATE INDEX idx_events_endpoint ON rate_limit_events (endpoint);
CREATE INDEX idx_events_policy ON rate_limit_events (policy_id);
CREATE INDEX idx_export_records_owner ON export_records (owner_username);
