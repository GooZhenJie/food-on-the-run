CREATE TABLE restaurants (
  id              BIGSERIAL PRIMARY KEY,
  owner_id        BIGINT        NOT NULL,
  name            VARCHAR(150)  NOT NULL,
  description     TEXT,
  image_url       VARCHAR(500),
  address_line_1  VARCHAR(255)  NOT NULL,
  city            VARCHAR(100)  NOT NULL,
  postcode        VARCHAR(20)   NOT NULL,
  lat             DECIMAL(10, 8),
  lng             DECIMAL(11, 8),
  phone           VARCHAR(20),
  is_open         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT fk_restaurants_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX idx_restaurants_city     ON restaurants(city) WHERE deleted_at IS NULL;
CREATE INDEX idx_restaurants_is_open  ON restaurants(is_open) WHERE deleted_at IS NULL;
CREATE INDEX trgm_restaurants_name    ON restaurants USING GIN (name gin_trgm_ops);
