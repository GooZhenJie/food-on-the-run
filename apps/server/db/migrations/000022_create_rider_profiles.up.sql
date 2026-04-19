CREATE TYPE rider_vehicle_type AS ENUM (
  'bicycle',
  'e_bike',
  'scooter',
  'motorbike',
  'car'
);

CREATE TYPE rider_online_status AS ENUM (
  'offline',
  'online',
  'on_delivery'
);

CREATE TABLE rider_profiles (
  id                     BIGSERIAL PRIMARY KEY,
  user_id                BIGINT               NOT NULL,
  vehicle_type           rider_vehicle_type   NOT NULL,
  vehicle_plate          VARCHAR(20),
  license_number         VARCHAR(50),
  license_expires_at     TIMESTAMPTZ,
  is_verified            BOOLEAN              NOT NULL DEFAULT FALSE,
  online_status          rider_online_status  NOT NULL DEFAULT 'offline',
  current_lat            DECIMAL(10, 8),
  current_lng            DECIMAL(11, 8),
  location_updated_at    TIMESTAMPTZ,
  rating_average         DECIMAL(3, 2),
  rating_count           INT                  NOT NULL DEFAULT 0,
  completed_deliveries   INT                  NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,

  CONSTRAINT fk_rider_profiles_users FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX uq_rider_profiles_user_id
  ON rider_profiles(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_rider_profiles_online_status
  ON rider_profiles(online_status)
  WHERE deleted_at IS NULL;
