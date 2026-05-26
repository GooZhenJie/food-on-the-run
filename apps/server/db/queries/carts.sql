-- name: GetCartByUser :one
SELECT * FROM carts WHERE user_id = $1 AND deleted_at IS NULL;

-- name: CreateCart :one
INSERT INTO carts (user_id, restaurant_id) VALUES ($1, $2) RETURNING *;

-- name: UpdateCartRestaurant :one
UPDATE carts SET restaurant_id = $1, updated_at = NOW()
WHERE id = $2 AND deleted_at IS NULL RETURNING *;

-- name: ClearCart :exec
UPDATE cart_items SET deleted_at = NOW() WHERE cart_id = $1 AND deleted_at IS NULL;

-- name: DeleteCart :exec
UPDATE carts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL;

-- name: ListCartItems :many
SELECT ci.id, ci.cart_id, ci.menu_item_id, ci.quantity, ci.note, ci.created_at, ci.updated_at,
       mi.name AS menu_item_name, mi.price_amount AS menu_item_price, mi.image_url AS menu_item_image
FROM cart_items ci
JOIN menu_items mi ON ci.menu_item_id = mi.id
WHERE ci.cart_id = $1 AND ci.deleted_at IS NULL
ORDER BY ci.created_at ASC;

-- name: UpsertCartItem :one
INSERT INTO cart_items (cart_id, menu_item_id, quantity, note)
VALUES ($1, $2, $3, $4)
ON CONFLICT (cart_id, menu_item_id) WHERE deleted_at IS NULL
DO UPDATE SET quantity = EXCLUDED.quantity, note = EXCLUDED.note, updated_at = NOW()
RETURNING *;

-- name: RemoveCartItem :exec
UPDATE cart_items SET deleted_at = NOW() WHERE cart_id = $1 AND menu_item_id = $2 AND deleted_at IS NULL;
