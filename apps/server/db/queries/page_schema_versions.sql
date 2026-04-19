-- name: CreatePageSchemaVersion :one
INSERT INTO page_schema_versions (page_schema_id, version, schema_data, note, creator_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListPageSchemaVersionsBySchemaID :many
SELECT * FROM page_schema_versions
WHERE page_schema_id = $1 AND deleted_at IS NULL
ORDER BY version DESC;

-- name: GetPageSchemaVersion :one
SELECT * FROM page_schema_versions
WHERE page_schema_id = $1 AND version = $2 AND deleted_at IS NULL
LIMIT 1;
