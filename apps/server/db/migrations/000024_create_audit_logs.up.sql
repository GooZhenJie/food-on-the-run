CREATE TABLE audit_logs (
  id             BIGSERIAL PRIMARY KEY,
  actor_id       BIGINT,
  actor_role     user_role,
  action         VARCHAR(100)   NOT NULL,
  resource_type  VARCHAR(100)   NOT NULL,
  resource_id    BIGINT,
  ip_address     INET,
  user_agent     VARCHAR(500),
  meta_data      JSONB          NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,

  CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_logs_actor_id    ON audit_logs(actor_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_logs_resource    ON audit_logs(resource_type, resource_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_logs_created_at  ON audit_logs(created_at DESC);
