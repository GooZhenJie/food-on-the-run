-- name: CreateUser :one
INSERT INTO users (name, email, phone, role)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: AdminListUsers :many
SELECT * FROM users
WHERE deleted_at IS NULL
  AND (sqlc.narg('role')::user_role IS NULL OR role = sqlc.narg('role'))
  AND (
    sqlc.narg('keyword')::text IS NULL
    OR name  ILIKE '%' || sqlc.narg('keyword') || '%'
    OR email ILIKE '%' || sqlc.narg('keyword') || '%'
  )
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: AdminCountUsers :one
SELECT COUNT(*) FROM users
WHERE deleted_at IS NULL
  AND (sqlc.narg('role')::user_role IS NULL OR role = sqlc.narg('role'))
  AND (
    sqlc.narg('keyword')::text IS NULL
    OR name  ILIKE '%' || sqlc.narg('keyword') || '%'
    OR email ILIKE '%' || sqlc.narg('keyword') || '%'
  );

-- name: AdminUpdateUserRole :one
UPDATE users
SET role = $2, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;
