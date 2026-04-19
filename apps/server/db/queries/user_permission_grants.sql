-- name: ListUserGrants :many
-- Returns raw grant rows for a user (admin UI: show all including expired).
SELECT
  upg.user_id,
  upg.permission_id,
  p.code        AS permission_code,
  upg.effect,
  upg.scope,
  upg.reason,
  upg.granted_by,
  upg.granted_at,
  upg.expires_at
FROM user_permission_grants upg
JOIN permissions p ON p.id = upg.permission_id
WHERE upg.user_id = $1
  AND p.deleted_at IS NULL
ORDER BY p.code;

-- name: ListUserGrantsForEval :many
-- Returns only non-expired grant rows for Actor evaluation.
SELECT
  p.code    AS permission_code,
  upg.effect,
  upg.scope,
  upg.expires_at
FROM user_permission_grants upg
JOIN permissions p ON p.id = upg.permission_id
WHERE upg.user_id = $1
  AND p.deleted_at IS NULL
  AND (upg.expires_at IS NULL OR upg.expires_at > NOW())
ORDER BY p.code;

-- name: UpsertUserGrant :exec
-- Writes / updates a single (user_id, permission_id) grant.
INSERT INTO user_permission_grants (
  user_id, permission_id, effect, scope, reason, granted_by, expires_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (user_id, permission_id) DO UPDATE
SET effect     = EXCLUDED.effect,
    scope      = EXCLUDED.scope,
    reason     = EXCLUDED.reason,
    granted_by = EXCLUDED.granted_by,
    expires_at = EXCLUDED.expires_at,
    granted_at = NOW();

-- name: DeleteUserGrant :exec
DELETE FROM user_permission_grants
WHERE user_id = $1 AND permission_id = $2;

-- name: GetUserGrant :one
SELECT
  upg.user_id,
  upg.permission_id,
  p.code        AS permission_code,
  upg.effect,
  upg.scope,
  upg.reason,
  upg.granted_by,
  upg.granted_at,
  upg.expires_at
FROM user_permission_grants upg
JOIN permissions p ON p.id = upg.permission_id
WHERE upg.user_id = $1 AND upg.permission_id = $2
LIMIT 1;
