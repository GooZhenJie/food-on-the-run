CREATE TYPE auth_provider AS ENUM (
  'password',
  'google',
  'apple',
  'facebook'
);

CREATE TABLE auth_credentials (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT        NOT NULL,
  provider            auth_provider NOT NULL,
  provider_user_id    VARCHAR(255),
  password_hash       VARCHAR(255),
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT fk_auth_credentials_users FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT chk_auth_credentials_payload CHECK (
    (provider = 'password' AND password_hash IS NOT NULL)
    OR (provider <> 'password' AND provider_user_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX uq_auth_credentials_user_provider
  ON auth_credentials(user_id, provider)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_auth_credentials_provider_subject
  ON auth_credentials(provider, provider_user_id)
  WHERE deleted_at IS NULL AND provider_user_id IS NOT NULL;

CREATE INDEX idx_auth_credentials_user_id ON auth_credentials(user_id) WHERE deleted_at IS NULL;
