CREATE TABLE user_permission_grants (
  user_id       BIGINT      NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  permission_id BIGINT      NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  effect        SMALLINT    NOT NULL CHECK (effect IN (1, -1)),
  scope         JSONB,
  reason        TEXT,
  granted_by    BIGINT      REFERENCES users(id),
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX idx_user_permission_grants_permission_id
  ON user_permission_grants(permission_id);

CREATE INDEX idx_user_permission_grants_expires_at
  ON user_permission_grants(expires_at)
  WHERE expires_at IS NOT NULL;
