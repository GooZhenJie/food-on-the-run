package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	db "github.com/food-on-the-run/server/db/sqlc"
	"github.com/food-on-the-run/server/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MerchantHandler struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewMerchantHandler(pool *pgxpool.Pool) *MerchantHandler {
	return &MerchantHandler{
		pool:    pool,
		queries: db.New(pool),
	}
}

type merchantRestaurantDTO struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description,omitempty"`
	ImageURL    string  `json:"image_url,omitempty"`
	AddressLine string  `json:"address_line_1"`
	City        string  `json:"city"`
	Postcode    string  `json:"postcode"`
	Phone       string  `json:"phone,omitempty"`
	IsOpen      bool    `json:"is_open"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type merchantOrderDTO struct {
	ID                int64  `json:"id"`
	CustomerID        int64  `json:"customer_id"`
	RestaurantID      int64  `json:"restaurant_id"`
	Status            string `json:"status"`
	SubtotalAmount    int64  `json:"subtotal_amount"`
	DeliveryFeeAmount int64  `json:"delivery_fee_amount"`
	TotalAmount       int64  `json:"total_amount"`
	Note              string `json:"note,omitempty"`
	CreatedAt         string `json:"created_at"`
	UpdatedAt         string `json:"updated_at"`
}

type merchantOrdersResponse struct {
	Items    []merchantOrderDTO `json:"items"`
	Page     int32              `json:"page"`
	PageSize int32              `json:"page_size"`
	Total    int64              `json:"total"`
}

type updateOrderStatusRequest struct {
	Status string `json:"status"`
}

// ListMyRestaurants handles GET /api/merchant/restaurants.
// Returns every restaurant owned by the calling merchant user.
func (h *MerchantHandler) ListMyRestaurants(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	rows, err := h.queries.ListRestaurantsByOwner(r.Context(), actor.UserID)
	if err != nil {
		log.Printf("merchant list restaurants: query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	items := make([]merchantRestaurantDTO, 0, len(rows))
	for _, row := range rows {
		items = append(items, toMerchantRestaurantDTO(row))
	}
	respondJSON(w, http.StatusOK, listEnvelope{Items: items})
}

// GetMyRestaurant handles GET /api/merchant/restaurants/{id}.
// Returns 403 when the restaurant is not in the caller's scope, regardless of
// whether it actually exists — don't leak existence.
func (h *MerchantHandler) GetMyRestaurant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	id, err := parseInt64PathValue(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	if !actor.ScopedToRestaurant(id) {
		respondError(w, http.StatusForbidden, "restaurant out of scope")
		return
	}
	row, err := h.queries.GetRestaurantByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "restaurant not found")
			return
		}
		log.Printf("merchant get restaurant: query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, toMerchantRestaurantDTO(row))
}

// ListMyOrders handles GET /api/merchant/orders?page=1&page_size=20.
// Always scope-filters by actor.Scopes.RestaurantIDs — an empty scope returns
// an empty list without hitting the DB.
func (h *MerchantHandler) ListMyOrders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	page, pageSize := parsePagination(r)
	if len(actor.Scopes.RestaurantIDs) == 0 {
		respondJSON(w, http.StatusOK, merchantOrdersResponse{
			Items:    []merchantOrderDTO{},
			Page:     page,
			PageSize: pageSize,
			Total:    0,
		})
		return
	}

	offset := (page - 1) * pageSize
	ctx := r.Context()
	items, err := h.queries.ListOrdersByRestaurants(ctx, db.ListOrdersByRestaurantsParams{
		RestaurantIds: actor.Scopes.RestaurantIDs,
		PgLimit:       pageSize,
		PgOffset:      offset,
	})
	if err != nil {
		log.Printf("merchant list orders: query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	total, err := h.queries.CountOrdersByRestaurants(ctx, actor.Scopes.RestaurantIDs)
	if err != nil {
		log.Printf("merchant list orders: count failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	dtos := make([]merchantOrderDTO, 0, len(items))
	for _, o := range items {
		dtos = append(dtos, toMerchantOrderDTO(o))
	}
	respondJSON(w, http.StatusOK, merchantOrdersResponse{
		Items:    dtos,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	})
}

// UpdateOrderStatus handles PATCH /api/merchant/orders/{id}/status.
// Uses a single UPDATE ... WHERE restaurant_id = ANY(...) so scope and write
// are enforced atomically.
func (h *MerchantHandler) UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	id, err := parseInt64PathValue(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	var req updateOrderStatusRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	next, ok := parseMerchantOrderStatus(req.Status)
	if !ok {
		respondError(w, http.StatusBadRequest, "invalid status")
		return
	}

	if len(actor.Scopes.RestaurantIDs) == 0 {
		respondError(w, http.StatusForbidden, "order out of scope")
		return
	}

	ctx := r.Context()
	existing, err := h.queries.GetOrderInRestaurants(ctx, db.GetOrderInRestaurantsParams{
		ID:            id,
		RestaurantIds: actor.Scopes.RestaurantIDs,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusForbidden, "order out of scope")
			return
		}
		log.Printf("merchant update order: lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if !isMerchantStatusTransitionAllowed(existing.Status, next) {
		respondError(w, http.StatusBadRequest, "invalid status transition")
		return
	}

	updated, err := h.queries.UpdateOrderStatusInRestaurants(ctx, db.UpdateOrderStatusInRestaurantsParams{
		ID:            id,
		RestaurantIds: actor.Scopes.RestaurantIDs,
		Status:        next,
	})
	if err != nil {
		log.Printf("merchant update order: update failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, toMerchantOrderDTO(updated))
}

// parseMerchantOrderStatus rejects statuses merchants shouldn't be able to set
// (picked_up / delivered belong to the rider flow; pending is the customer's).
func parseMerchantOrderStatus(s string) (db.OrderStatus, bool) {
	switch db.OrderStatus(s) {
	case db.OrderStatusConfirmed, db.OrderStatusPreparing, db.OrderStatusReady, db.OrderStatusCancelled:
		return db.OrderStatus(s), true
	}
	return "", false
}

// isMerchantStatusTransitionAllowed gates the merchant-side state machine.
// Allowed flow: pending -> confirmed -> preparing -> ready. Cancel from any
// non-terminal state.
func isMerchantStatusTransitionAllowed(from, to db.OrderStatus) bool {
	if to == db.OrderStatusCancelled {
		switch from {
		case db.OrderStatusPending, db.OrderStatusConfirmed, db.OrderStatusPreparing:
			return true
		}
		return false
	}
	switch from {
	case db.OrderStatusPending:
		return to == db.OrderStatusConfirmed
	case db.OrderStatusConfirmed:
		return to == db.OrderStatusPreparing
	case db.OrderStatusPreparing:
		return to == db.OrderStatusReady
	}
	return false
}

func parseInt64PathValue(r *http.Request, name string) (int64, error) {
	v := r.PathValue(name)
	id, err := strconv.ParseInt(v, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid " + name)
	}
	return id, nil
}

func toMerchantRestaurantDTO(row db.Restaurant) merchantRestaurantDTO {
	dto := merchantRestaurantDTO{
		ID:          row.ID,
		Name:        row.Name,
		AddressLine: row.AddressLine1,
		City:        row.City,
		Postcode:    row.Postcode,
		IsOpen:      row.IsOpen,
		CreatedAt:   row.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   row.UpdatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
	}
	if row.Description.Valid {
		dto.Description = row.Description.String
	}
	if row.ImageUrl.Valid {
		dto.ImageURL = row.ImageUrl.String
	}
	if row.Phone.Valid {
		dto.Phone = row.Phone.String
	}
	return dto
}

func toMerchantOrderDTO(row db.Order) merchantOrderDTO {
	dto := merchantOrderDTO{
		ID:                row.ID,
		CustomerID:        row.CustomerID,
		RestaurantID:      row.RestaurantID,
		Status:            string(row.Status),
		SubtotalAmount:    row.SubtotalAmount,
		DeliveryFeeAmount: row.DeliveryFeeAmount,
		TotalAmount:       row.TotalAmount,
		CreatedAt:         row.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:         row.UpdatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
	}
	if row.Note.Valid {
		dto.Note = row.Note.String
	}
	return dto
}
