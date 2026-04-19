-- name: ListUserRoleCodes :many
-- Returns role codes scoped to the user's current persona.
SELECT r.code
FROM roles r
JOIN user_role_assignments ura ON ura.role_id = r.id
JOIN users u ON u.id = ura.user_id
WHERE ura.user_id = $1
  AND r.deleted_at IS NULL
  AND u.deleted_at IS NULL
  AND r.persona = u.role
ORDER BY r.code;

-- name: ListUserPermissionCodes :many
-- Returns distinct permission codes derived from the user's roles, persona-filtered.
SELECT DISTINCT p.code
FROM permissions p
JOIN role_permissions rp ON rp.permission_id = p.id
JOIN roles r ON r.id = rp.role_id
JOIN user_role_assignments ura ON ura.role_id = r.id
JOIN users u ON u.id = ura.user_id
WHERE ura.user_id = $1
  AND p.deleted_at IS NULL
  AND r.deleted_at IS NULL
  AND u.deleted_at IS NULL
  AND r.persona = u.role
ORDER BY p.code;

-- name: ListUserRolesDetail :many
-- Full role rows for a user (persona-filtered).
SELECT r.*
FROM roles r
JOIN user_role_assignments ura ON ura.role_id = r.id
JOIN users u ON u.id = ura.user_id
WHERE ura.user_id = $1
  AND r.deleted_at IS NULL
  AND u.deleted_at IS NULL
  AND r.persona = u.role
ORDER BY r.code;

-- name: DeleteUserRolesByUserID :exec
DELETE FROM user_role_assignments WHERE user_id = $1;

-- name: AddUserRole :exec
INSERT INTO user_role_assignments (user_id, role_id, granted_by)
VALUES ($1, $2, $3)
ON CONFLICT DO NOTHING;

-- name: UpsertUserRoleBinding :exec
-- Writes a (user_id, role_id) assignment with scope + expires_at.
-- Re-runnable: on conflict overwrites scope / expires_at / granted_by.
INSERT INTO user_role_assignments (user_id, role_id, granted_by, scope, expires_at)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (user_id, role_id) DO UPDATE
SET scope      = EXCLUDED.scope,
    expires_at = EXCLUDED.expires_at,
    granted_by = EXCLUDED.granted_by,
    granted_at = NOW();

-- name: ListUserRoleBindings :many
-- Returns the full role binding (role + scope + expires_at) for a user,
-- persona-filtered. Used by LoadActor.
SELECT
  r.id         AS role_id,
  r.code       AS role_code,
  r.persona    AS role_persona,
  ura.scope    AS scope,
  ura.expires_at AS expires_at
FROM user_role_assignments ura
JOIN roles r ON r.id = ura.role_id
JOIN users u ON u.id = ura.user_id
WHERE ura.user_id = $1
  AND r.deleted_at IS NULL
  AND u.deleted_at IS NULL
  AND r.persona = u.role
  AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
ORDER BY r.code;

-- name: ListRolePermissionCodesByRoleIDs :many
-- Returns (role_id, permission_code) pairs for a batch of role ids.
-- Used by LoadActor to hydrate each RoleBinding's permission set in one round-trip.
SELECT rp.role_id, p.code
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
WHERE rp.role_id = ANY($1::bigint[])
  AND p.deleted_at IS NULL
ORDER BY rp.role_id, p.code;

-- name: GrantDefaultRoleForPersona :exec
-- Grants the <persona>.default role to the user (no-op if already granted).
INSERT INTO user_role_assignments (user_id, role_id, granted_by)
SELECT sqlc.arg('user_id')::bigint, r.id, sqlc.narg('granted_by')::bigint
FROM roles r
WHERE r.code = (sqlc.arg('persona')::text || '.default')
  AND r.deleted_at IS NULL
ON CONFLICT DO NOTHING;
