-- name: CreatePasswordCredential :one
INSERT INTO auth_credentials (user_id, provider, password_hash)
VALUES ($1, 'password', $2)
RETURNING *;

-- name: GetPasswordCredentialByUserID :one
SELECT * FROM auth_credentials
WHERE user_id = $1
  AND provider = 'password'
  AND deleted_at IS NULL
LIMIT 1;

-- name: UpdateAuthCredentialLastLogin :exec
UPDATE auth_credentials
SET last_login_at = NOW(),
    updated_at = NOW()
WHERE id = $1;
