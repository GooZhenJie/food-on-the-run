package handlers

import (
	"net/http"
	"strconv"

	db "github.com/food-on-the-run/server/db/sqlc"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PublicRestaurantHandler struct {
	queries *db.Queries
}

func NewPublicRestaurantHandler(pool *pgxpool.Pool) *PublicRestaurantHandler {
	return &PublicRestaurantHandler{queries: db.New(pool)}
}

func (h *PublicRestaurantHandler) List(w http.ResponseWriter, r *http.Request) {
	restaurants, err := h.queries.ListPublicRestaurants(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to list restaurants")
		return
	}
	respondJSON(w, http.StatusOK, restaurants)
}

func (h *PublicRestaurantHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid restaurant ID")
		return
	}

	restaurant, err := h.queries.GetPublicRestaurant(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Restaurant not found")
		return
	}
	respondJSON(w, http.StatusOK, restaurant)
}
