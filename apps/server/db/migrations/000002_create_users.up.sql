CREATE TABLE users (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  NOT NULL,
  phone       VARCHAR(20),
  role        user_role     NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_users_email ON users(email) WHERE deleted_at IS NULL;

CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
