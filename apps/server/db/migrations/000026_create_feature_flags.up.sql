CREATE TABLE feature_flags (
  id               BIGSERIAL PRIMARY KEY,
  key              VARCHAR(100)  NOT NULL,
  description      TEXT,
  is_enabled       BOOLEAN       NOT NULL DEFAULT FALSE,
  rollout_percent  SMALLINT      NOT NULL DEFAULT 0,
  config           JSONB         NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,

  CONSTRAINT chk_feature_flags_rollout CHECK (rollout_percent BETWEEN 0 AND 100)
);

CREATE UNIQUE INDEX uq_feature_flags_key
  ON feature_flags(key)
  WHERE deleted_at IS NULL;

CREATE TABLE feature_flag_overrides (
  id              BIGSERIAL PRIMARY KEY,
  feature_flag_id BIGINT        NOT NULL,
  user_id         BIGINT        NOT NULL,
  is_enabled      BOOLEAN       NOT NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT fk_feature_flag_overrides_feature_flags
    FOREIGN KEY (feature_flag_id) REFERENCES feature_flags(id) ON DELETE CASCADE,
  CONSTRAINT fk_feature_flag_overrides_users
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX uq_feature_flag_overrides_flag_user
  ON feature_flag_overrides(feature_flag_id, user_id)
  WHERE deleted_at IS NULL;
