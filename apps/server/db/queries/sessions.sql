-- name: CreateSession :one
INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip_address, device_id, expires_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetActiveSessionByTokenHash :one
SELECT * FROM sessions
WHERE refresh_token_hash = $1
  AND deleted_at IS NULL
  AND revoked_at IS NULL
  AND expires_at > NOW()
LIMIT 1;

-- name: RevokeSession :exec
UPDATE sessions
SET revoked_at = NOW(),
    updated_at = NOW()
WHERE id = $1;

-- name: UpdateSessionLastUsed :exec
UPDATE sessions
SET last_used_at = NOW(),
    updated_at = NOW()
WHERE id = $1;
