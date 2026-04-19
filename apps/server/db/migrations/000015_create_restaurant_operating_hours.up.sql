CREATE TABLE restaurant_operating_hours (
  id              BIGSERIAL PRIMARY KEY,
  restaurant_id   BIGINT       NOT NULL,
  day_of_week     SMALLINT     NOT NULL,
  open_time       TIME         NOT NULL,
  close_time      TIME         NOT NULL,
  is_closed       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT fk_restaurant_operating_hours_restaurants
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  CONSTRAINT chk_restaurant_operating_hours_day_of_week
    CHECK (day_of_week BETWEEN 0 AND 6)
);

CREATE INDEX idx_restaurant_operating_hours_restaurant_id
  ON restaurant_operating_hours(restaurant_id)
  WHERE deleted_at IS NULL;
