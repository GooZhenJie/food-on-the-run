-- name: ListOrdersByRestaurants :many
SELECT * FROM orders
WHERE restaurant_id = ANY(sqlc.arg('restaurant_ids')::bigint[])
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT sqlc.arg('pg_limit')::int OFFSET sqlc.arg('pg_offset')::int;

-- name: CountOrdersByRestaurants :one
SELECT COUNT(*) FROM orders
WHERE restaurant_id = ANY(sqlc.arg('restaurant_ids')::bigint[])
  AND deleted_at IS NULL;

-- name: GetOrderInRestaurants :one
SELECT * FROM orders
WHERE id = sqlc.arg('id')::bigint
  AND restaurant_id = ANY(sqlc.arg('restaurant_ids')::bigint[])
  AND deleted_at IS NULL;

-- name: UpdateOrderStatusInRestaurants :one
UPDATE orders
SET status = sqlc.arg('status')::order_status, updated_at = NOW()
WHERE id = sqlc.arg('id')::bigint
  AND restaurant_id = ANY(sqlc.arg('restaurant_ids')::bigint[])
  AND deleted_at IS NULL
RETURNING *;
