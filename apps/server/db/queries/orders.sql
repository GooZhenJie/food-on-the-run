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

-- name: CreateOrder :one
INSERT INTO orders (customer_id, restaurant_id, status, subtotal_amount, delivery_fee_amount, total_amount, note)
VALUES ($1, $2, 'pending', $3, $4, $5, $6) RETURNING *;

-- name: CreateOrderItem :one
INSERT INTO order_items (order_id, menu_item_id, name, price_amount, quantity)
VALUES ($1, $2, $3, $4, $5) RETURNING *;

-- name: ListOrdersByCustomer :many
SELECT o.id, o.customer_id, o.restaurant_id, o.address_id, o.status,
       o.subtotal_amount, o.delivery_fee_amount, o.total_amount, o.note,
       o.created_at, o.updated_at, o.deleted_at,
       r.name AS restaurant_name, r.image_url AS restaurant_image
FROM orders o
JOIN restaurants r ON o.restaurant_id = r.id
WHERE o.customer_id = $1 AND o.deleted_at IS NULL
ORDER BY o.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetOrderByCustomer :one
SELECT * FROM orders WHERE id = $1 AND customer_id = $2 AND deleted_at IS NULL;

-- name: ListOrderItemsByOrder :many
SELECT * FROM order_items WHERE order_id = $1 AND deleted_at IS NULL;

-- name: UpdateOrderStatus :one
UPDATE orders SET status = $1, updated_at = NOW()
WHERE id = $2 AND deleted_at IS NULL RETURNING *;
