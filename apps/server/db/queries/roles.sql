-- name: ListRoles :many
SELECT * FROM roles
WHERE deleted_at IS NULL
ORDER BY persona, code;

-- name: ListRolesByPersona :many
SELECT * FROM roles
WHERE deleted_at IS NULL
  AND persona = $1
ORDER BY code;

-- name: GetRoleByCode :one
SELECT * FROM roles
WHERE code = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: GetRoleByID :one
SELECT * FROM roles
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: ListPermissionsByRoleID :many
SELECT p.*
FROM permissions p
JOIN role_permissions rp ON rp.permission_id = p.id
WHERE rp.role_id = $1
  AND p.deleted_at IS NULL
ORDER BY p.code;

-- name: ListRolesWithPermissions :many
SELECT
  r.id         AS role_id,
  r.code       AS role_code,
  r.name       AS role_name,
  r.persona    AS role_persona,
  r.is_system  AS role_is_system,
  p.code       AS permission_code
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id AND p.deleted_at IS NULL
WHERE r.deleted_at IS NULL
ORDER BY r.persona, r.code, p.code;

-- name: CreateRole :one
INSERT INTO roles (code, name, persona, is_system)
VALUES ($1, $2, $3, FALSE)
RETURNING *;

-- name: UpdateRoleName :one
UPDATE roles
SET name       = $2,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeleteRole :exec
UPDATE roles
SET deleted_at = NOW(),
    updated_at = NOW()
WHERE id = $1
  AND is_system = FALSE
  AND deleted_at IS NULL;

-- name: CountUserAssignmentsByRoleID :one
SELECT COUNT(*) FROM user_role_assignments WHERE role_id = $1;

-- name: DeleteRolePermissions :exec
DELETE FROM role_permissions WHERE role_id = $1;

-- name: AddRolePermissionByCode :exec
-- Inserts a (role_id, permission_id) row by looking up the permission code.
-- No-op when the permission code does not exist.
INSERT INTO role_permissions (role_id, permission_id)
SELECT $1::bigint, p.id
FROM permissions p
WHERE p.code = $2
  AND p.deleted_at IS NULL
ON CONFLICT DO NOTHING;
