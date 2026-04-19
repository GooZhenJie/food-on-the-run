package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	db "github.com/food-on-the-run/server/db/sqlc"
	"github.com/food-on-the-run/server/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserHandler struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewUserHandler(pool *pgxpool.Pool) *UserHandler {
	return &UserHandler{
		pool:    pool,
		queries: db.New(pool),
	}
}

type adminUserDTO struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Phone     string `json:"phone,omitempty"`
	Role      string `json:"role"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type adminListUsersResponse struct {
	Items    []adminUserDTO `json:"items"`
	Page     int32          `json:"page"`
	PageSize int32          `json:"page_size"`
	Total    int64          `json:"total"`
}

type adminUpdateUserRoleRequest struct {
	Role string `json:"role"`
}

const (
	defaultPageSize = 20
	maxPageSize     = 100
)

// AdminList handles GET /api/admin/users.
// Query params: page (default 1), page_size (default 20, max 100),
// role (optional: customer/rider/merchant/admin), keyword (optional, matches name/email).
func (h *UserHandler) AdminList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	page, pageSize := parsePagination(r)
	roleParam := strings.TrimSpace(r.URL.Query().Get("role"))
	keyword := strings.TrimSpace(r.URL.Query().Get("keyword"))

	roleFilter, err := parseRoleFilter(roleParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	keywordArg := pgtype.Text{Valid: false}
	if keyword != "" {
		keywordArg = pgtype.Text{String: keyword, Valid: true}
	}

	ctx := r.Context()
	offset := (page - 1) * pageSize

	items, err := h.queries.AdminListUsers(ctx, db.AdminListUsersParams{
		Limit:   pageSize,
		Offset:  offset,
		Role:    roleFilter,
		Keyword: keywordArg,
	})
	if err != nil {
		log.Printf("admin list users: query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	total, err := h.queries.AdminCountUsers(ctx, db.AdminCountUsersParams{
		Role:    roleFilter,
		Keyword: keywordArg,
	})
	if err != nil {
		log.Printf("admin list users: count failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	resp := adminListUsersResponse{
		Items:    make([]adminUserDTO, 0, len(items)),
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}
	for _, u := range items {
		resp.Items = append(resp.Items, toAdminUserDTO(u))
	}
	respondJSON(w, http.StatusOK, resp)
}

// AdminUpdateRole handles PATCH /api/admin/users/{id}/role.
// Body: { "role": "customer" | "rider" | "merchant" | "admin" }.
// Self-demotion is blocked to avoid super admins accidentally locking themselves out.
func (h *UserHandler) AdminUpdateRole(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		respondError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	var req adminUpdateUserRoleRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	role, ok := toUserRole(req.Role)
	if !ok {
		respondError(w, http.StatusBadRequest, "invalid role")
		return
	}

	if id == actor.UserID && role != db.UserRoleAdmin {
		respondError(w, http.StatusBadRequest, "cannot demote yourself")
		return
	}

	ctx := r.Context()
	user, err := h.queries.AdminUpdateUserRole(ctx, db.AdminUpdateUserRoleParams{
		ID:   id,
		Role: role,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}
		log.Printf("admin update user role: query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, toAdminUserDTO(user))
}

func parsePagination(r *http.Request) (int32, int32) {
	page := int32(1)
	pageSize := int32(defaultPageSize)
	if v := r.URL.Query().Get("page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 1 {
			page = int32(n)
		}
	}
	if v := r.URL.Query().Get("page_size"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 1 {
			if n > maxPageSize {
				n = maxPageSize
			}
			pageSize = int32(n)
		}
	}
	return page, pageSize
}

func parseRoleFilter(s string) (db.NullUserRole, error) {
	if s == "" {
		return db.NullUserRole{Valid: false}, nil
	}
	role, ok := toUserRole(s)
	if !ok {
		return db.NullUserRole{}, errors.New("invalid role filter")
	}
	return db.NullUserRole{UserRole: role, Valid: true}, nil
}

func toUserRole(s string) (db.UserRole, bool) {
	switch db.UserRole(s) {
	case db.UserRoleCustomer, db.UserRoleRider, db.UserRoleAdmin:
		return db.UserRole(s), true
	}
	return "", false
}

func toAdminUserDTO(u db.User) adminUserDTO {
	phone := ""
	if u.Phone.Valid {
		phone = u.Phone.String
	}
	return adminUserDTO{
		ID:        strconv.FormatInt(u.ID, 10),
		Name:      u.Name,
		Email:     u.Email,
		Phone:     phone,
		Role:      string(u.Role),
		CreatedAt: u.CreatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: u.UpdatedAt.Time.Format("2006-01-02T15:04:05Z07:00"),
	}
}
