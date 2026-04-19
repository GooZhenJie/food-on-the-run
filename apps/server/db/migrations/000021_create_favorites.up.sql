CREATE TYPE favorite_target_type AS ENUM (
  'restaurant',
  'menu_item'
);

CREATE TABLE favorites (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT                NOT NULL,
  target_type     favorite_target_type  NOT NULL,
  target_id       BIGINT                NOT NULL,
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT fk_favorites_users FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX uq_favorites_user_target
  ON favorites(user_id, target_type, target_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_favorites_target
  ON favorites(target_type, target_id)
  WHERE deleted_at IS NULL;
