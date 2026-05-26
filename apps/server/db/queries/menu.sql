-- name: ListMenuCategoriesByRestaurant :many
SELECT * FROM menu_categories
WHERE restaurant_id = $1 AND deleted_at IS NULL
ORDER BY sort_order ASC, name ASC;

-- name: ListMenuItemsByRestaurant :many
SELECT * FROM menu_items
WHERE restaurant_id = $1 AND deleted_at IS NULL AND is_available = true
ORDER BY category_id ASC, name ASC;
