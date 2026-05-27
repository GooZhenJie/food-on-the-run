package handlers

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/food-on-the-run/server/auth"
	"github.com/food-on-the-run/server/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AdminRestaurantHandler serves /api/admin/restaurants endpoints.
// Both admin and merchant personas are allowed; merchants see only their own restaurants.
type AdminRestaurantHandler struct {
	pool *pgxpool.Pool
}

func NewAdminRestaurantHandler(pool *pgxpool.Pool) *AdminRestaurantHandler {
	return &AdminRestaurantHandler{pool: pool}
}

type adminRestaurantDTO struct {
	ID                string  `json:"id"`
	Name              string  `json:"name"`
	Cuisine           string  `json:"cuisine"`
	Status            string  `json:"status"`
	OwnerEmail        string  `json:"ownerEmail"`
	OwnerName         string  `json:"ownerName"`
	City              string  `json:"city"`
	Phone             string  `json:"phone"`
	Address           string  `json:"address"`
	Rating            float64 `json:"rating"`
	OrdersToday       int64   `json:"ordersToday"`
	RevenueMonthCents int64   `json:"revenueMonthCents"`
	CreatedAt         string  `json:"createdAt"`
	UpdatedAt         string  `json:"updatedAt"`
}

type adminListRestaurantsResponse struct {
	Items    []adminRestaurantDTO `json:"items"`
	Page     int32                `json:"page"`
	PageSize int32                `json:"page_size"`
	Total    int64                `json:"total"`
}

type adminRestaurantUpsertBody struct {
	Name       string `json:"name"`
	Cuisine    string `json:"cuisine"`
	Status     string `json:"status"`
	OwnerEmail string `json:"ownerEmail"`
	City       string `json:"city"`
	Phone      string `json:"phone"`
	Address    string `json:"address"`
}

type adminUpdateRestaurantStatusBody struct {
	Status string `json:"status"`
}

var validRestaurantStatuses = map[string]bool{
	"active":    true,
	"pending":   true,
	"suspended": true,
}

// restaurantListFilters holds parsed query filter values.
type restaurantListFilters struct {
	keyword string
	status  string
	cuisine string
	city    string
}

// ownerScope returns &actor.UserID when actor is a merchant (scope to their own
// restaurants), or nil when actor is admin (see all).
func ownerScope(actor *auth.Actor) *int64 {
	if actor != nil && actor.Persona == auth.PersonaMerchant {
		id := actor.UserID
		return &id
	}
	return nil
}

// buildCountWhere builds the WHERE clause for the COUNT query.
// Parameter indices start at $1 (no time args precede them).
// ownerID, when non-nil, restricts to that owner (merchant scope).
func buildCountWhere(f restaurantListFilters, ownerID *int64) (where string, args []any) {
	conditions := []string{"r.deleted_at IS NULL"}
	idx := 1

	if ownerID != nil {
		conditions = append(conditions, fmt.Sprintf("r.owner_id = $%d", idx))
		args = append(args, *ownerID)
		idx++
	}
	if f.keyword != "" {
		kw := "%" + f.keyword + "%"
		conditions = append(conditions, fmt.Sprintf(
			"(r.name ILIKE $%d OR u.name ILIKE $%d OR u.email ILIKE $%d OR CAST(r.id AS TEXT) = $%d)",
			idx, idx+1, idx+2, idx+3,
		))
		args = append(args, kw, kw, kw, f.keyword)
		idx += 4
	}
	if f.status != "" && validRestaurantStatuses[f.status] {
		conditions = append(conditions, fmt.Sprintf("r.status = $%d", idx))
		args = append(args, f.status)
		idx++
	}
	if f.cuisine != "" {
		conditions = append(conditions, fmt.Sprintf("r.cuisine = $%d", idx))
		args = append(args, f.cuisine)
		idx++
	}
	if f.city != "" {
		conditions = append(conditions, fmt.Sprintf("r.city = $%d", idx))
		args = append(args, f.city)
		idx++
	}
	_ = idx
	return strings.Join(conditions, " AND "), args
}

// buildListWhere builds the WHERE clause for the SELECT query.
// $1=todayStart, $2=monthStart are always the first two args (used by subqueries).
// Filter parameter indices start at $3.
func buildListWhere(f restaurantListFilters, ownerID *int64) (where string, filterArgs []any, nextIdx int) {
	conditions := []string{"r.deleted_at IS NULL"}
	idx := 3

	if ownerID != nil {
		conditions = append(conditions, fmt.Sprintf("r.owner_id = $%d", idx))
		filterArgs = append(filterArgs, *ownerID)
		idx++
	}
	if f.keyword != "" {
		kw := "%" + f.keyword + "%"
		conditions = append(conditions, fmt.Sprintf(
			"(r.name ILIKE $%d OR u.name ILIKE $%d OR u.email ILIKE $%d OR CAST(r.id AS TEXT) = $%d)",
			idx, idx+1, idx+2, idx+3,
		))
		filterArgs = append(filterArgs, kw, kw, kw, f.keyword)
		idx += 4
	}
	if f.status != "" && validRestaurantStatuses[f.status] {
		conditions = append(conditions, fmt.Sprintf("r.status = $%d", idx))
		filterArgs = append(filterArgs, f.status)
		idx++
	}
	if f.cuisine != "" {
		conditions = append(conditions, fmt.Sprintf("r.cuisine = $%d", idx))
		filterArgs = append(filterArgs, f.cuisine)
		idx++
	}
	if f.city != "" {
		conditions = append(conditions, fmt.Sprintf("r.city = $%d", idx))
		filterArgs = append(filterArgs, f.city)
		idx++
	}
	return strings.Join(conditions, " AND "), filterArgs, idx
}

// adminRestaurantListSQL is the shared SELECT+FROM+JOIN.
// $1=todayStart, $2=monthStart; caller appends WHERE starting at $3.
const adminRestaurantListSQL = `
SELECT
  r.id,
  r.name,
  r.cuisine,
  r.status,
  u.email  AS owner_email,
  u.name   AS owner_name,
  r.city,
  COALESCE(r.phone, '')    AS phone,
  r.address_line_1         AS address,
  COALESCE(
    (SELECT ROUND(AVG(rv.rating)::numeric, 1)::float8
     FROM reviews rv
     WHERE rv.target_type = 'restaurant'
       AND rv.target_id   = r.id
       AND rv.deleted_at  IS NULL),
    0
  ) AS rating,
  COALESCE(
    (SELECT COUNT(*)::bigint
     FROM orders o
     WHERE o.restaurant_id = r.id
       AND o.created_at   >= $1
       AND o.deleted_at    IS NULL),
    0
  ) AS orders_today,
  COALESCE(
    (SELECT COALESCE(SUM(o.total_amount), 0)::bigint
     FROM orders o
     WHERE o.restaurant_id = r.id
       AND o.created_at   >= $2
       AND o.status        = 'delivered'
       AND o.deleted_at    IS NULL),
    0
  ) AS revenue_month_cents,
  r.created_at,
  r.updated_at
FROM restaurants r
JOIN users u ON u.id = r.owner_id AND u.deleted_at IS NULL
`

// AdminListRestaurants handles GET /api/admin/restaurants.
func (h *AdminRestaurantHandler) AdminListRestaurants(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	page, pageSize := parsePagination(r)
	f := restaurantListFilters{
		keyword: strings.TrimSpace(r.URL.Query().Get("keyword")),
		status:  strings.TrimSpace(r.URL.Query().Get("status")),
		cuisine: strings.TrimSpace(r.URL.Query().Get("cuisine")),
		city:    strings.TrimSpace(r.URL.Query().Get("city")),
	}
	sortField := r.URL.Query().Get("sort_field")
	sortOrder := r.URL.Query().Get("sort_order")
	ownerID := ownerScope(actor)

	ctx := r.Context()

	countWhere, countArgs := buildCountWhere(f, ownerID)
	countSQL := fmt.Sprintf(
		"SELECT COUNT(*) FROM restaurants r JOIN users u ON u.id = r.owner_id AND u.deleted_at IS NULL WHERE %s",
		countWhere,
	)
	var total int64
	if err := h.pool.QueryRow(ctx, countSQL, countArgs...).Scan(&total); err != nil {
		log.Printf("admin list restaurants: count failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	items := make([]adminRestaurantDTO, 0)
	if total > 0 {
		now := time.Now().UTC()
		todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
		monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

		listWhere, filterArgs, nextIdx := buildListWhere(f, ownerID)
		orderByCol, orderByDir := resolveRestaurantSort(sortField, sortOrder)
		offset := (page - 1) * pageSize

		listArgs := append([]any{todayStart, monthStart}, filterArgs...)
		listArgs = append(listArgs, int(pageSize), int(offset))

		listSQL := fmt.Sprintf(
			"%s WHERE %s ORDER BY %s %s LIMIT $%d OFFSET $%d",
			adminRestaurantListSQL, listWhere, orderByCol, orderByDir, nextIdx, nextIdx+1,
		)

		rows, err := h.pool.Query(ctx, listSQL, listArgs...)
		if err != nil {
			log.Printf("admin list restaurants: query failed: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		defer rows.Close()

		for rows.Next() {
			dto, scanErr := scanAdminRestaurantRow(rows)
			if scanErr != nil {
				log.Printf("admin list restaurants: scan failed: %v", scanErr)
				respondError(w, http.StatusInternalServerError, "internal server error")
				return
			}
			items = append(items, dto)
		}
		if err := rows.Err(); err != nil {
			log.Printf("admin list restaurants: rows error: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
	}

	respondJSON(w, http.StatusOK, adminListRestaurantsResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	})
}

// AdminExportRestaurants handles GET /api/admin/restaurants/export.
func (h *AdminRestaurantHandler) AdminExportRestaurants(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	f := restaurantListFilters{
		keyword: strings.TrimSpace(r.URL.Query().Get("keyword")),
		status:  strings.TrimSpace(r.URL.Query().Get("status")),
		cuisine: strings.TrimSpace(r.URL.Query().Get("cuisine")),
		city:    strings.TrimSpace(r.URL.Query().Get("city")),
	}
	ownerID := ownerScope(actor)

	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	listWhere, filterArgs, _ := buildListWhere(f, ownerID)
	orderByCol, orderByDir := resolveRestaurantSort(
		r.URL.Query().Get("sort_field"),
		r.URL.Query().Get("sort_order"),
	)
	listArgs := append([]any{todayStart, monthStart}, filterArgs...)
	exportSQL := fmt.Sprintf(
		"%s WHERE %s ORDER BY %s %s",
		adminRestaurantListSQL, listWhere, orderByCol, orderByDir,
	)

	ctx := r.Context()
	rows, err := h.pool.Query(ctx, exportSQL, listArgs...)
	if err != nil {
		log.Printf("admin export restaurants: query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	defer rows.Close()

	items := make([]adminRestaurantDTO, 0)
	for rows.Next() {
		dto, scanErr := scanAdminRestaurantRow(rows)
		if scanErr != nil {
			log.Printf("admin export restaurants: scan failed: %v", scanErr)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		items = append(items, dto)
	}
	if err := rows.Err(); err != nil {
		log.Printf("admin export restaurants: rows error: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"items": items,
		"total": int64(len(items)),
	})
}

// AdminGetRestaurant handles GET /api/admin/restaurants/{id}.
func (h *AdminRestaurantHandler) AdminGetRestaurant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	id, err := parseInt64PathValue(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	dto, err := h.fetchOne(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "restaurant not found")
			return
		}
		log.Printf("admin get restaurant: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	// Merchants can only view their own restaurants.
	if actor != nil && actor.Persona == auth.PersonaMerchant && dto.OwnerEmail != "" {
		if !actor.ScopedToRestaurant(id) {
			respondError(w, http.StatusForbidden, "restaurant out of scope")
			return
		}
	}

	respondJSON(w, http.StatusOK, dto)
}

// AdminCreateRestaurant handles POST /api/admin/restaurants.
func (h *AdminRestaurantHandler) AdminCreateRestaurant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())

	var body adminRestaurantUpsertBody
	if err := decodeJSON(r, &body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(body.Name) == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}
	status := body.Status
	if status == "" {
		status = "active"
	}
	if !validRestaurantStatuses[status] {
		respondError(w, http.StatusBadRequest, "invalid status")
		return
	}

	ctx := r.Context()

	var ownerID int64
	if actor != nil && actor.Persona == auth.PersonaMerchant {
		// Merchants always own the restaurant they create.
		ownerID = actor.UserID
	} else {
		// Admin must supply ownerEmail.
		if strings.TrimSpace(body.OwnerEmail) == "" {
			respondError(w, http.StatusBadRequest, "ownerEmail is required")
			return
		}
		err := h.pool.QueryRow(ctx,
			"SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL",
			strings.ToLower(strings.TrimSpace(body.OwnerEmail)),
		).Scan(&ownerID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				respondError(w, http.StatusUnprocessableEntity, "owner not found")
				return
			}
			log.Printf("admin create restaurant: owner lookup failed: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
	}

	var id int64
	if err := h.pool.QueryRow(ctx, `
		INSERT INTO restaurants (owner_id, name, cuisine, status, address_line_1, city, postcode, phone)
		VALUES ($1, $2, $3, $4, $5, $6, '', $7)
		RETURNING id`,
		ownerID,
		strings.TrimSpace(body.Name),
		body.Cuisine,
		status,
		body.Address,
		body.City,
		strOrNil(body.Phone),
	).Scan(&id); err != nil {
		log.Printf("admin create restaurant: insert failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	dto, err := h.fetchOne(ctx, id)
	if err != nil {
		log.Printf("admin create restaurant: fetch failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusCreated, dto)
}

// AdminUpdateRestaurant handles PATCH /api/admin/restaurants/{id}.
func (h *AdminRestaurantHandler) AdminUpdateRestaurant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	id, err := parseInt64PathValue(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	if actor != nil && actor.Persona == auth.PersonaMerchant && !actor.ScopedToRestaurant(id) {
		respondError(w, http.StatusForbidden, "restaurant out of scope")
		return
	}

	var body adminRestaurantUpsertBody
	if err := decodeJSON(r, &body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ctx := r.Context()
	setClauses := []string{"updated_at = NOW()"}
	args := []any{}
	argIdx := 1

	if v := strings.TrimSpace(body.Name); v != "" {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, v)
		argIdx++
	}
	if body.Cuisine != "" {
		setClauses = append(setClauses, fmt.Sprintf("cuisine = $%d", argIdx))
		args = append(args, body.Cuisine)
		argIdx++
	}
	if body.Status != "" {
		if !validRestaurantStatuses[body.Status] {
			respondError(w, http.StatusBadRequest, "invalid status")
			return
		}
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, body.Status)
		argIdx++
	}
	if body.City != "" {
		setClauses = append(setClauses, fmt.Sprintf("city = $%d", argIdx))
		args = append(args, body.City)
		argIdx++
	}
	if body.Address != "" {
		setClauses = append(setClauses, fmt.Sprintf("address_line_1 = $%d", argIdx))
		args = append(args, body.Address)
		argIdx++
	}
	if body.Phone != "" {
		setClauses = append(setClauses, fmt.Sprintf("phone = $%d", argIdx))
		args = append(args, body.Phone)
		argIdx++
	}
	// Only admin can reassign owner.
	if actor != nil && actor.Persona == auth.PersonaAdmin {
		if v := strings.ToLower(strings.TrimSpace(body.OwnerEmail)); v != "" {
			var ownerID int64
			if err := h.pool.QueryRow(ctx,
				"SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL", v,
			).Scan(&ownerID); err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					respondError(w, http.StatusUnprocessableEntity, "owner not found")
					return
				}
				log.Printf("admin update restaurant: owner lookup failed: %v", err)
				respondError(w, http.StatusInternalServerError, "internal server error")
				return
			}
			setClauses = append(setClauses, fmt.Sprintf("owner_id = $%d", argIdx))
			args = append(args, ownerID)
			argIdx++
		}
	}

	args = append(args, id)
	ct, err := h.pool.Exec(ctx, fmt.Sprintf(
		"UPDATE restaurants SET %s WHERE id = $%d AND deleted_at IS NULL",
		strings.Join(setClauses, ", "), argIdx,
	), args...)
	if err != nil {
		log.Printf("admin update restaurant: exec failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if ct.RowsAffected() == 0 {
		respondError(w, http.StatusNotFound, "restaurant not found")
		return
	}

	dto, err := h.fetchOne(ctx, id)
	if err != nil {
		log.Printf("admin update restaurant: fetch failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, dto)
}

// AdminDeleteRestaurant handles DELETE /api/admin/restaurants/{id}.
func (h *AdminRestaurantHandler) AdminDeleteRestaurant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	id, err := parseInt64PathValue(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	if actor != nil && actor.Persona == auth.PersonaMerchant && !actor.ScopedToRestaurant(id) {
		respondError(w, http.StatusForbidden, "restaurant out of scope")
		return
	}

	ctx := r.Context()
	ct, err := h.pool.Exec(ctx,
		"UPDATE restaurants SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
		id,
	)
	if err != nil {
		log.Printf("admin delete restaurant: exec failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if ct.RowsAffected() == 0 {
		respondError(w, http.StatusNotFound, "restaurant not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// AdminUpdateRestaurantStatus handles POST /api/admin/restaurants/{id}/status.
func (h *AdminRestaurantHandler) AdminUpdateRestaurantStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	id, err := parseInt64PathValue(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	if actor != nil && actor.Persona == auth.PersonaMerchant && !actor.ScopedToRestaurant(id) {
		respondError(w, http.StatusForbidden, "restaurant out of scope")
		return
	}

	var body adminUpdateRestaurantStatusBody
	if err := decodeJSON(r, &body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if !validRestaurantStatuses[body.Status] {
		respondError(w, http.StatusBadRequest, "invalid status")
		return
	}

	ctx := r.Context()
	ct, err := h.pool.Exec(ctx,
		"UPDATE restaurants SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL",
		body.Status, id,
	)
	if err != nil {
		log.Printf("admin update restaurant status: exec failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if ct.RowsAffected() == 0 {
		respondError(w, http.StatusNotFound, "restaurant not found")
		return
	}

	dto, err := h.fetchOne(ctx, id)
	if err != nil {
		log.Printf("admin update restaurant status: fetch failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, dto)
}

// fetchOne fetches a single restaurant DTO by ID.
func (h *AdminRestaurantHandler) fetchOne(ctx context.Context, id int64) (adminRestaurantDTO, error) {
	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	query := fmt.Sprintf("%s WHERE r.id = $3 AND r.deleted_at IS NULL", adminRestaurantListSQL)
	return scanAdminRestaurantRow(h.pool.QueryRow(ctx, query, todayStart, monthStart, id))
}

// resolveRestaurantSort maps frontend sort field names to SQL expressions.
func resolveRestaurantSort(field, order string) (col, dir string) {
	switch field {
	case "name":
		col = "r.name"
	case "status":
		col = "r.status"
	case "rating":
		col = "rating"
	case "ordersToday":
		col = "orders_today"
	case "revenueMonthCents":
		col = "revenue_month_cents"
	default:
		col = "r.created_at"
	}
	if strings.ToLower(order) == "asc" {
		dir = "ASC"
	} else {
		dir = "DESC"
	}
	return
}

// scanAdminRestaurantRow scans a row from adminRestaurantListSQL.
func scanAdminRestaurantRow(row pgx.Row) (adminRestaurantDTO, error) {
	var (
		dto       adminRestaurantDTO
		id        int64
		createdAt time.Time
		updatedAt time.Time
	)
	err := row.Scan(
		&id,
		&dto.Name,
		&dto.Cuisine,
		&dto.Status,
		&dto.OwnerEmail,
		&dto.OwnerName,
		&dto.City,
		&dto.Phone,
		&dto.Address,
		&dto.Rating,
		&dto.OrdersToday,
		&dto.RevenueMonthCents,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return dto, err
	}
	dto.ID = fmt.Sprintf("%d", id)
	dto.CreatedAt = createdAt.Format(time.RFC3339)
	dto.UpdatedAt = updatedAt.Format(time.RFC3339)
	return dto, nil
}

// strOrNil returns nil for empty strings (maps to SQL NULL).
func strOrNil(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
