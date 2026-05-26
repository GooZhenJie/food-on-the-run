-- name: ListRestaurantIDsByOwner :many
SELECT id FROM restaurants
WHERE owner_id = $1 AND deleted_at IS NULL
ORDER BY id;

-- name: ListRestaurantsByOwner :many
SELECT * FROM restaurants
WHERE owner_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: GetRestaurantByID :one
SELECT * FROM restaurants
WHERE id = $1 AND deleted_at IS NULL;

-- name: ListRestaurantSummariesByIDs :many
SELECT id, name FROM restaurants
WHERE id = ANY($1::bigint[]) AND deleted_at IS NULL
ORDER BY id;

-- name: ListPublicRestaurants :many
SELECT * FROM restaurants
WHERE is_open = true AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: GetPublicRestaurant :one
SELECT * FROM restaurants
WHERE id = $1 AND deleted_at IS NULL;
