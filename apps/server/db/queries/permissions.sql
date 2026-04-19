-- name: ListPermissions :many
SELECT * FROM permissions
WHERE deleted_at IS NULL
ORDER BY code;

-- name: GetPermissionByCode :one
SELECT * FROM permissions
WHERE code = $1 AND deleted_at IS NULL
LIMIT 1;
