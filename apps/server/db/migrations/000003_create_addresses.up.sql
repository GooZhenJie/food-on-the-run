CREATE TABLE addresses (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT        NOT NULL,
  label            VARCHAR(50),
  address_line_1   VARCHAR(255)  NOT NULL,
  address_line_2   VARCHAR(255),
  city             VARCHAR(100)  NOT NULL,
  postcode         VARCHAR(20)   NOT NULL,
  lat              DECIMAL(10, 8),
  lng              DECIMAL(11, 8),
  is_default       BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,

  CONSTRAINT fk_addresses_users FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id) WHERE deleted_at IS NULL;
