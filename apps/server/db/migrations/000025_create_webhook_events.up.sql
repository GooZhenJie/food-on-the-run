CREATE TYPE webhook_event_status AS ENUM (
  'received',
  'processing',
  'succeeded',
  'failed',
  'skipped'
);

CREATE TABLE webhook_events (
  id                    BIGSERIAL PRIMARY KEY,
  provider              VARCHAR(100)          NOT NULL,
  event_type            VARCHAR(150)          NOT NULL,
  provider_event_id     VARCHAR(255)          NOT NULL,
  status                webhook_event_status  NOT NULL DEFAULT 'received',
  payload_data          JSONB                 NOT NULL,
  signature             VARCHAR(500),
  error_message         TEXT,
  retry_count           INT                   NOT NULL DEFAULT 0,
  processed_at          TIMESTAMPTZ,
  received_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_webhook_events_provider_event
  ON webhook_events(provider, provider_event_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_webhook_events_status
  ON webhook_events(status, received_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX gin_webhook_events_payload_data
  ON webhook_events USING GIN (payload_data);
