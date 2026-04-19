CREATE TABLE page_schemas (
  id               BIGSERIAL    PRIMARY KEY,
  key              VARCHAR(200) NOT NULL,
  current_version  INT          NOT NULL DEFAULT 0,
  schema_data      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,

  CONSTRAINT chk_page_schemas_key_prefix  CHECK (key LIKE '/%'),
  CONSTRAINT chk_page_schemas_version_min CHECK (current_version >= 0)
);

CREATE UNIQUE INDEX uq_page_schemas_key
  ON page_schemas(key)
  WHERE deleted_at IS NULL;

CREATE TABLE page_schema_versions (
  id              BIGSERIAL    PRIMARY KEY,
  page_schema_id  BIGINT       NOT NULL,
  version         INT          NOT NULL,
  schema_data     JSONB        NOT NULL,
  note            TEXT,
  creator_id      BIGINT       NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT fk_page_schema_versions_page_schemas
    FOREIGN KEY (page_schema_id) REFERENCES page_schemas(id) ON DELETE CASCADE,
  CONSTRAINT fk_page_schema_versions_creator
    FOREIGN KEY (creator_id) REFERENCES users(id),
  CONSTRAINT chk_page_schema_versions_version_min CHECK (version >= 1)
);

CREATE UNIQUE INDEX uq_page_schema_versions_schema_version
  ON page_schema_versions(page_schema_id, version)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_page_schema_versions_schema_created_at
  ON page_schema_versions(page_schema_id, created_at DESC);

CREATE INDEX idx_page_schema_versions_creator_id
  ON page_schema_versions(creator_id);
