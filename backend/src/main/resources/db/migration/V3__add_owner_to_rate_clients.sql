ALTER TABLE rate_clients ADD COLUMN owner_username VARCHAR(160) NULL;
UPDATE rate_clients SET owner_username = 'admin' WHERE owner_username IS NULL;
CREATE INDEX idx_rate_clients_owner ON rate_clients (owner_username);