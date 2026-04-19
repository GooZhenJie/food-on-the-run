CREATE TABLE carts (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT        NOT NULL,
  restaurant_id  BIGINT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,

  CONSTRAINT fk_carts_users       FOREIGN KEY (user_id)       REFERENCES users(id),
  CONSTRAINT fk_carts_restaurants FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uq_carts_user_id
  ON carts(user_id)
  WHERE deleted_at IS NULL;

CREATE TABLE cart_items (
  id            BIGSERIAL PRIMARY KEY,
  cart_id       BIGINT        NOT NULL,
  menu_item_id  BIGINT        NOT NULL,
  quantity      INT           NOT NULL DEFAULT 1,
  note          TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,

  CONSTRAINT fk_cart_items_carts      FOREIGN KEY (cart_id)      REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_menu_items FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
  CONSTRAINT chk_cart_items_quantity  CHECK (quantity > 0)
);

CREATE UNIQUE INDEX uq_cart_items_cart_menu_item
  ON cart_items(cart_id, menu_item_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id) WHERE deleted_at IS NULL;
