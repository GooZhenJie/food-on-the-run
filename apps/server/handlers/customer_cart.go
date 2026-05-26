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

type CustomerCartHandler struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewCustomerCartHandler(pool *pgxpool.Pool) *CustomerCartHandler {
	return &CustomerCartHandler{
		pool:    pool,
		queries: db.New(pool),
	}
}

type cartItemDTO struct {
	MenuItemID    int64  `json:"menu_item_id"`
	MenuItemName  string `json:"menu_item_name"`
	MenuItemPrice int64  `json:"menu_item_price"`
	MenuItemImage string `json:"menu_item_image,omitempty"`
	Quantity      int32  `json:"quantity"`
	Note          string `json:"note,omitempty"`
}

type cartResponse struct {
	RestaurantID *int64        `json:"restaurant_id,omitempty"`
	Items        []cartItemDTO `json:"items"`
}

type addCartItemRequest struct {
	MenuItemID int64  `json:"menu_item_id"`
	Quantity   int32  `json:"quantity"`
	Note       string `json:"note"`
}

// GetCart handles GET /api/customer/cart.
// Returns the current user's cart with items.
func (h *CustomerCartHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	ctx := r.Context()
	cart, err := h.queries.GetCartByUser(ctx, actor.UserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// No cart yet — return empty.
			respondJSON(w, http.StatusOK, cartResponse{Items: []cartItemDTO{}})
			return
		}
		log.Printf("cart: get cart failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	items, err := h.queries.ListCartItems(ctx, cart.ID)
	if err != nil {
		log.Printf("cart: list items failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	resp := cartResponse{
		Items: make([]cartItemDTO, 0, len(items)),
	}
	if cart.RestaurantID.Valid {
		resp.RestaurantID = &cart.RestaurantID.Int64
	}
	for _, item := range items {
		dto := cartItemDTO{
			MenuItemID:    item.MenuItemID,
			MenuItemName:  item.MenuItemName,
			MenuItemPrice: item.MenuItemPrice,
			Quantity:      item.Quantity,
		}
		if item.Note.Valid {
			dto.Note = item.Note.String
		}
		if item.MenuItemImage.Valid {
			dto.MenuItemImage = item.MenuItemImage.String
		}
		resp.Items = append(resp.Items, dto)
	}
	respondJSON(w, http.StatusOK, resp)
}

// AddCartItem handles POST /api/customer/cart/items.
// Adds or updates an item in the current user's cart.
// If the cart is for a different restaurant, clears it first.
func (h *CustomerCartHandler) AddCartItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	var req addCartItemRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.MenuItemID <= 0 {
		respondError(w, http.StatusBadRequest, "menu_item_id is required")
		return
	}
	if req.Quantity <= 0 {
		respondError(w, http.StatusBadRequest, "quantity must be > 0")
		return
	}

	ctx := r.Context()

	// Look up the menu item to get its restaurant_id.
	var menuItemRestaurantID int64
	err := h.pool.QueryRow(ctx,
		"SELECT restaurant_id FROM menu_items WHERE id = $1 AND deleted_at IS NULL AND is_available = true",
		req.MenuItemID,
	).Scan(&menuItemRestaurantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusBadRequest, "menu item not found or unavailable")
			return
		}
		log.Printf("cart: lookup menu item failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	// Get or create cart.
	cart, err := h.queries.GetCartByUser(ctx, actor.UserID)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("cart: get cart failed: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		// Create a new cart.
		cart, err = h.queries.CreateCart(ctx, db.CreateCartParams{
			UserID:       actor.UserID,
			RestaurantID: pgtype.Int8{Int64: menuItemRestaurantID, Valid: true},
		})
		if err != nil {
			log.Printf("cart: create cart failed: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
	} else {
		// Cart exists — check if restaurant changed.
		if cart.RestaurantID.Valid && cart.RestaurantID.Int64 != menuItemRestaurantID {
			// Clear existing items and update restaurant.
			if err := h.queries.ClearCart(ctx, cart.ID); err != nil {
				log.Printf("cart: clear cart failed: %v", err)
				respondError(w, http.StatusInternalServerError, "internal server error")
				return
			}
			cart, err = h.queries.UpdateCartRestaurant(ctx, db.UpdateCartRestaurantParams{
				RestaurantID: pgtype.Int8{Int64: menuItemRestaurantID, Valid: true},
				ID:           cart.ID,
			})
			if err != nil {
				log.Printf("cart: update restaurant failed: %v", err)
				respondError(w, http.StatusInternalServerError, "internal server error")
				return
			}
		} else if !cart.RestaurantID.Valid {
			// Cart has no restaurant yet — set it.
			cart, err = h.queries.UpdateCartRestaurant(ctx, db.UpdateCartRestaurantParams{
				RestaurantID: pgtype.Int8{Int64: menuItemRestaurantID, Valid: true},
				ID:           cart.ID,
			})
			if err != nil {
				log.Printf("cart: update restaurant failed: %v", err)
				respondError(w, http.StatusInternalServerError, "internal server error")
				return
			}
		}
	}

	// Upsert the cart item.
	note := pgtype.Text{}
	if req.Note != "" {
		note = pgtype.Text{String: req.Note, Valid: true}
	}
	_, err = h.queries.UpsertCartItem(ctx, db.UpsertCartItemParams{
		CartID:     cart.ID,
		MenuItemID: req.MenuItemID,
		Quantity:   req.Quantity,
		Note:       note,
	})
	if err != nil {
		log.Printf("cart: upsert item failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// RemoveCartItem handles DELETE /api/customer/cart/items/{menu_item_id}.
// Removes an item from the current user's cart.
func (h *CustomerCartHandler) RemoveCartItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	menuItemID, err := parseInt64PathValue(r, "menu_item_id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	cart, err := h.queries.GetCartByUser(ctx, actor.UserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "cart not found")
			return
		}
		log.Printf("cart: get cart failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	err = h.queries.RemoveCartItem(ctx, db.RemoveCartItemParams{
		CartID:     cart.ID,
		MenuItemID: menuItemID,
	})
	if err != nil {
		log.Printf("cart: remove item failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// ClearCart handles DELETE /api/customer/cart.
// Soft-deletes the cart and all items.
func (h *CustomerCartHandler) ClearCart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	ctx := r.Context()
	cart, err := h.queries.GetCartByUser(ctx, actor.UserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// No cart — nothing to clear.
			respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
			return
		}
		log.Printf("cart: get cart failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if err := h.queries.ClearCart(ctx, cart.ID); err != nil {
		log.Printf("cart: clear items failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if err := h.queries.DeleteCart(ctx, cart.ID); err != nil {
		log.Printf("cart: delete cart failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
