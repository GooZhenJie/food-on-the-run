CREATE TABLE menu_categories (
  id             BIGSERIAL PRIMARY KEY,
  restaurant_id  BIGINT        NOT NULL,
  name           VARCHAR(100)  NOT NULL,
  sort_order     INT           NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,

  CONSTRAINT fk_menu_categories_restaurants FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE menu_items (
  id             BIGSERIAL PRIMARY KEY,
  restaurant_id  BIGINT        NOT NULL,
  category_id    BIGINT,
  name           VARCHAR(150)  NOT NULL,
  description    TEXT,
  image_url      VARCHAR(500),
  price_amount   BIGINT        NOT NULL,
  is_available   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,

  CONSTRAINT fk_menu_items_restaurants   FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_menu_items_menu_categories FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
  CONSTRAINT chk_menu_items_price        CHECK (price_amount >= 0)
);

CREATE INDEX idx_menu_categories_restaurant_id ON menu_categories(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_restaurant_id      ON menu_items(restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_category_id        ON menu_items(category_id) WHERE deleted_at IS NULL;
CREATE INDEX trgm_menu_items_name              ON menu_items USING GIN (name gin_trgm_ops);
