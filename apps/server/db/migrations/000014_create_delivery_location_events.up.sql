CREATE TABLE delivery_location_events (
  id              BIGSERIAL PRIMARY KEY,
  delivery_id     BIGINT          NOT NULL,
  rider_id        BIGINT          NOT NULL,
  lat             DECIMAL(10, 8)  NOT NULL,
  lng             DECIMAL(11, 8)  NOT NULL,
  accuracy_meters DECIMAL(10, 2),
  heading_degrees DECIMAL(6, 2),
  speed_mps       DECIMAL(6, 2),
  recorded_at     TIMESTAMPTZ     NOT NULL,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT fk_delivery_location_events_deliveries FOREIGN KEY (delivery_id) REFERENCES deliveries(id),
  CONSTRAINT fk_delivery_location_events_rider      FOREIGN KEY (rider_id)    REFERENCES users(id)
);

CREATE INDEX idx_delivery_location_events_delivery_id
  ON delivery_location_events(delivery_id, recorded_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_delivery_location_events_rider_id
  ON delivery_location_events(rider_id, recorded_at DESC)
  WHERE deleted_at IS NULL;
