CREATE TABLE sessions (
  id                   BIGSERIAL PRIMARY KEY,
  user_id              BIGINT        NOT NULL,
  refresh_token_hash   VARCHAR(255)  NOT NULL,
  user_agent           VARCHAR(500),
  ip_address           INET,
  device_id            VARCHAR(255),
  expires_at           TIMESTAMPTZ   NOT NULL,
  revoked_at           TIMESTAMPTZ,
  last_used_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,

  CONSTRAINT fk_sessions_users FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX uq_sessions_refresh_token_hash
  ON sessions(refresh_token_hash)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_sessions_user_id     ON sessions(user_id)     WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_expires_at  ON sessions(expires_at)  WHERE deleted_at IS NULL AND revoked_at IS NULL;
