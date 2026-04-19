-- name: GetPageSchemaByKey :one
SELECT * FROM page_schemas
WHERE key = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: ListPageSchemas :many
SELECT * FROM page_schemas
WHERE deleted_at IS NULL
ORDER BY key ASC;

-- name: ListPageSchemasWithUpdater :many
SELECT
  ps.id,
  ps.key,
  ps.current_version,
  ps.schema_data,
  ps.created_at,
  ps.updated_at,
  ps.deleted_at,
  u.id    AS updater_id,
  u.name  AS updater_name,
  u.email AS updater_email
FROM page_schemas ps
LEFT JOIN page_schema_versions psv
  ON psv.page_schema_id = ps.id
  AND psv.version = ps.current_version
  AND psv.deleted_at IS NULL
LEFT JOIN users u
  ON u.id = psv.creator_id
WHERE ps.deleted_at IS NULL
ORDER BY ps.key ASC;

-- name: CreatePageSchema :one
INSERT INTO page_schemas (key, current_version, schema_data)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdatePageSchemaCurrent :one
UPDATE page_schemas
SET current_version = $2,
    schema_data = $3,
    updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeletePageSchemaByKey :one
UPDATE page_schemas
SET deleted_at = NOW(),
    updated_at = NOW()
WHERE key = $1 AND deleted_at IS NULL
RETURNING *;
