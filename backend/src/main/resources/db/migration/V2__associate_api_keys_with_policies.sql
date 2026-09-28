ALTER TABLE api_keys ADD COLUMN policy_id BIGINT NULL;
ALTER TABLE api_keys ADD CONSTRAINT fk_api_keys_policy FOREIGN KEY (policy_id) REFERENCES rate_policies (id);
CREATE INDEX idx_api_keys_policy ON api_keys (policy_id);