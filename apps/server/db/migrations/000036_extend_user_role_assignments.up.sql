ALTER TABLE user_role_assignments
  ADD COLUMN scope      JSONB,
  ADD COLUMN expires_at TIMESTAMPTZ;

CREATE INDEX idx_user_role_assignments_expires_at
  ON user_role_assignments(expires_at)
  WHERE expires_at IS NOT NULL;
