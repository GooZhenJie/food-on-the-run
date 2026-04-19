CREATE TABLE menu_item_options (
  id              BIGSERIAL PRIMARY KEY,
  menu_item_id    BIGINT        NOT NULL,
  name            VARCHAR(100)  NOT NULL,
  is_required     BOOLEAN       NOT NULL DEFAULT FALSE,
  min_select      INT           NOT NULL DEFAULT 0,
  max_select      INT           NOT NULL DEFAULT 1,
  sort_order      INT           NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT fk_menu_item_options_menu_items
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  CONSTRAINT chk_menu_item_options_select_range
    CHECK (min_select >= 0 AND max_select >= min_select)
);

CREATE INDEX idx_menu_item_options_menu_item_id
  ON menu_item_options(menu_item_id)
  WHERE deleted_at IS NULL;

CREATE TABLE menu_item_option_values (
  id              BIGSERIAL PRIMARY KEY,
  option_id       BIGINT        NOT NULL,
  name            VARCHAR(100)  NOT NULL,
  price_amount    BIGINT        NOT NULL DEFAULT 0,
  sort_order      INT           NOT NULL DEFAULT 0,
  is_default      BOOLEAN       NOT NULL DEFAULT FALSE,
  is_available    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT fk_menu_item_option_values_options
    FOREIGN KEY (option_id) REFERENCES menu_item_options(id) ON DELETE CASCADE,
  CONSTRAINT chk_menu_item_option_values_price CHECK (price_amount >= 0)
);

CREATE INDEX idx_menu_item_option_values_option_id
  ON menu_item_option_values(option_id)
  WHERE deleted_at IS NULL;
