package handlers

import (
	"errors"
	"log"
	"net/http"

	db "github.com/food-on-the-run/server/db/sqlc"
	"github.com/food-on-the-run/server/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CustomerOrderHandler struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewCustomerOrderHandler(pool *pgxpool.Pool) *CustomerOrderHandler {
	return &CustomerOrderHandler{
		pool:    pool,
		queries: db.New(pool),
	}
}

type customerOrderDTO struct {
	ID                int64  `json:"id"`
	RestaurantID      int64  `json:"restaurant_id"`
	RestaurantName    string `json:"restaurant_name,omitempty"`
	RestaurantImage   string `json:"restaurant_image,omitempty"`
	Status            string `json:"status"`
	SubtotalAmount    int64  `json:"subtotal_amount"`
	DeliveryFeeAmount int64  `json:"delivery_fee_amount"`
	TotalAmount       int64  `json:"total_amount"`
	Note              string `json:"note,omitempty"`
	CreatedAt         string `json:"created_at"`
	UpdatedAt         string `json:"updated_at"`
}

type customerOrderItemDTO struct {
	MenuItemID  int64  `json:"menu_item_id"`
	Name        string `json:"name"`
	PriceAmount int64  `json:"price_amount"`
	Quantity    int32  `json:"quantity"`
}

type customerOrderDetailDTO struct {
	customerOrderDTO
	Items []customerOrderItemDTO `json:"items"`
}

type customerOrdersResponse struct {
	Items    []customerOrderDTO `json:"items"`
	Page     int32              `json:"page"`
	PageSize int32              `json:"page_size"`
}

type createOrderRequest struct {
	DeliveryFeeAmount int64  `json:"delivery_fee_amount"`
	Note              string `json:"note"`
}

// CreateOrder handles POST /api/customer/orders.
// Creates an order from the customer's current cart, then clears the cart.
func (h *CustomerOrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	var req createOrderRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ctx := r.Context()

	// Get the user's cart.
	cart, err := h.queries.GetCartByUser(ctx, actor.UserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusBadRequest, "cart is empty")
			return
		}
		log.Printf("customer orders: get cart failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if !cart.RestaurantID.Valid {
		respondError(w, http.StatusBadRequest, "cart has no restaurant")
		return
	}

	// Get cart items.
	cartItems, err := h.queries.ListCartItems(ctx, cart.ID)
	if err != nil {
		log.Printf("customer orders: list cart items failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if len(cartItems) == 0 {
		respondError(w, http.StatusBadRequest, "cart is empty")
		return
	}

	// Calculate subtotal.
	var subtotal int64
	for _, item := range cartItems {
		subtotal += item.MenuItemPrice * int64(item.Quantity)
	}
	total := subtotal + req.DeliveryFeeAmount

	// Use a transaction to create the order + items + clear cart atomically.
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		log.Printf("customer orders: begin tx failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	defer tx.Rollback(ctx)

	qtx := h.queries.WithTx(tx)

	note := pgtype.Text{}
	if req.Note != "" {
		note = pgtype.Text{String: req.Note, Valid: true}
	}

	order, err := qtx.CreateOrder(ctx, db.CreateOrderParams{
		CustomerID:        actor.UserID,
		RestaurantID:      cart.RestaurantID.Int64,
		SubtotalAmount:    subtotal,
		DeliveryFeeAmount: req.DeliveryFeeAmount,
		TotalAmount:       total,
		Note:              note,
	})
	if err != nil {
		log.Printf("customer orders: create order failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	// Create order items.
	for _, ci := range cartItems {
		_, err := qtx.CreateOrderItem(ctx, db.CreateOrderItemParams{
			OrderID:     order.ID,
			MenuItemID:  ci.MenuItemID,
			Name:        ci.MenuItemName,
			PriceAmount: ci.MenuItemPrice,
			Quantity:    ci.Quantity,
		})
		if err != nil {
			log.Printf("customer orders: create order item failed: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
	}

	// Clear the cart.
	if err := qtx.ClearCart(ctx, cart.ID); err != nil {
		log.Printf("customer orders: clear cart failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if err := qtx.DeleteCart(ctx, cart.ID); err != nil {
		log.Printf("customer orders: delete cart failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if err := tx.Commit(ctx); err != nil {
		log.Printf("customer orders: commit tx failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, customerOrderDTO{
		ID:                order.ID,
		RestaurantID:      order.RestaurantID,
		Status:            string(order.Status),
		SubtotalAmount:    order.SubtotalAmount,
		DeliveryFeeAmount: order.DeliveryFeeAmount,
		TotalAmount:       order.TotalAmount,
		Note:              noteToString(order.Note),
		CreatedAt:         order.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:         order.UpdatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
	})
}

// ListOrders handles GET /api/customer/orders.
// Returns paginated list of the customer's orders.
func (h *CustomerOrderHandler) ListOrders(w http.ResponseWriter, r *http.Request) {
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
	offset := (page - 1) * pageSize

	ctx := r.Context()
	rows, err := h.queries.ListOrdersByCustomer(ctx, db.ListOrdersByCustomerParams{
		CustomerID: actor.UserID,
		Limit:      pageSize,
		Offset:     offset,
	})
	if err != nil {
		log.Printf("customer orders: list failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	items := make([]customerOrderDTO, 0, len(rows))
	for _, row := range rows {
		dto := customerOrderDTO{
			ID:                row.ID,
			RestaurantID:      row.RestaurantID,
			RestaurantName:    row.RestaurantName,
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
		if row.RestaurantImage.Valid {
			dto.RestaurantImage = row.RestaurantImage.String
		}
		items = append(items, dto)
	}

	respondJSON(w, http.StatusOK, customerOrdersResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
	})
}

// GetOrder handles GET /api/customer/orders/{id}.
// Returns order detail with items.
func (h *CustomerOrderHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	orderID, err := parseInt64PathValue(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	order, err := h.queries.GetOrderByCustomer(ctx, db.GetOrderByCustomerParams{
		ID:         orderID,
		CustomerID: actor.UserID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "order not found")
			return
		}
		log.Printf("customer orders: get order failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	orderItems, err := h.queries.ListOrderItemsByOrder(ctx, order.ID)
	if err != nil {
		log.Printf("customer orders: list order items failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	items := make([]customerOrderItemDTO, 0, len(orderItems))
	for _, oi := range orderItems {
		items = append(items, customerOrderItemDTO{
			MenuItemID:  oi.MenuItemID,
			Name:        oi.Name,
			PriceAmount: oi.PriceAmount,
			Quantity:    oi.Quantity,
		})
	}

	respondJSON(w, http.StatusOK, customerOrderDetailDTO{
		customerOrderDTO: customerOrderDTO{
			ID:                order.ID,
			RestaurantID:      order.RestaurantID,
			Status:            string(order.Status),
			SubtotalAmount:    order.SubtotalAmount,
			DeliveryFeeAmount: order.DeliveryFeeAmount,
			TotalAmount:       order.TotalAmount,
			Note:              noteToString(order.Note),
			CreatedAt:         order.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:         order.UpdatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		},
		Items: items,
	})
}

// PayOrder handles POST /api/customer/orders/{id}/pay.
// Simulates payment by setting order status to 'confirmed'.
func (h *CustomerOrderHandler) PayOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	orderID, err := parseInt64PathValue(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()

	// Verify ownership.
	order, err := h.queries.GetOrderByCustomer(ctx, db.GetOrderByCustomerParams{
		ID:         orderID,
		CustomerID: actor.UserID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "order not found")
			return
		}
		log.Printf("customer orders: get order for pay failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	// Only pending orders can be paid.
	if order.Status != db.OrderStatusPending {
		respondError(w, http.StatusBadRequest, "order is not in pending status")
		return
	}

	updated, err := h.queries.UpdateOrderStatus(ctx, db.UpdateOrderStatusParams{
		Status: db.OrderStatusConfirmed,
		ID:     order.ID,
	})
	if err != nil {
		log.Printf("customer orders: update status failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, customerOrderDTO{
		ID:                updated.ID,
		RestaurantID:      updated.RestaurantID,
		Status:            string(updated.Status),
		SubtotalAmount:    updated.SubtotalAmount,
		DeliveryFeeAmount: updated.DeliveryFeeAmount,
		TotalAmount:       updated.TotalAmount,
		Note:              noteToString(updated.Note),
		CreatedAt:         updated.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:         updated.UpdatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
	})
}

func noteToString(n pgtype.Text) string {
	if n.Valid {
		return n.String
	}
	return ""
}
