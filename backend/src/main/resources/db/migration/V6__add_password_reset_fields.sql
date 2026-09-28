ALTER TABLE app_users ADD COLUMN password_reset_token VARCHAR(120) NULL UNIQUE;
ALTER TABLE app_users ADD COLUMN password_reset_expires_at TIMESTAMP(6) NULL;