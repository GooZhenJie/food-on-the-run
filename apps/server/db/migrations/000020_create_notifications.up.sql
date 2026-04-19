CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'sms',
  'push'
);

CREATE TYPE notification_type AS ENUM (
  'order_update',
  'delivery_update',
  'promotion',
  'system',
  'review_request'
);

CREATE TABLE notifications (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT                NOT NULL,
  channel        notification_channel  NOT NULL,
  type           notification_type     NOT NULL,
  title          VARCHAR(200)          NOT NULL,
  body           TEXT                  NOT NULL,
  meta_data      JSONB                 NOT NULL DEFAULT '{}'::jsonb,
  read_at        TIMESTAMPTZ,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,

  CONSTRAINT fk_notifications_users FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE deleted_at IS NULL AND read_at IS NULL;

CREATE INDEX idx_notifications_user_id
  ON notifications(user_id, created_at DESC)
  WHERE deleted_at IS NULL;
