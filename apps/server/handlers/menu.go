package handlers

import (
	"log"
	"net/http"

	db "github.com/food-on-the-run/server/db/sqlc"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MenuHandler struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewMenuHandler(pool *pgxpool.Pool) *MenuHandler {
	return &MenuHandler{
		pool:    pool,
		queries: db.New(pool),
	}
}

type menuCategoryDTO struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	SortOrder int32  `json:"sort_order"`
}

type menuItemDTO struct {
	ID          int64  `json:"id"`
	CategoryID  *int64 `json:"category_id,omitempty"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	ImageURL    string `json:"image_url,omitempty"`
	PriceAmount int64  `json:"price_amount"`
}

type menuResponse struct {
	Categories []menuCategoryDTO `json:"categories"`
	Items      []menuItemDTO     `json:"items"`
}

// GetRestaurantMenu handles GET /api/public/restaurants/{id}/menu.
// Returns menu categories with items grouped by category.
func (h *MenuHandler) GetRestaurantMenu(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	restaurantID, err := parseInt64PathValue(r, "id")
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()

	categories, err := h.queries.ListMenuCategoriesByRestaurant(ctx, restaurantID)
	if err != nil {
		log.Printf("menu: list categories failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	items, err := h.queries.ListMenuItemsByRestaurant(ctx, restaurantID)
	if err != nil {
		log.Printf("menu: list items failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	catDTOs := make([]menuCategoryDTO, 0, len(categories))
	for _, cat := range categories {
		catDTOs = append(catDTOs, menuCategoryDTO{
			ID:        cat.ID,
			Name:      cat.Name,
			SortOrder: cat.SortOrder,
		})
	}

	itemDTOs := make([]menuItemDTO, 0, len(items))
	for _, item := range items {
		dto := menuItemDTO{
			ID:          item.ID,
			Name:        item.Name,
			PriceAmount: item.PriceAmount,
		}
		if item.CategoryID.Valid {
			dto.CategoryID = &item.CategoryID.Int64
		}
		if item.Description.Valid {
			dto.Description = item.Description.String
		}
		if item.ImageUrl.Valid {
			dto.ImageURL = item.ImageUrl.String
		}
		itemDTOs = append(itemDTOs, dto)
	}

	respondJSON(w, http.StatusOK, menuResponse{
		Categories: catDTOs,
		Items:      itemDTOs,
	})
}
