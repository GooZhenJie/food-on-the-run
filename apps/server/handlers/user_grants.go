package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	db "github.com/food-on-the-run/server/db/sqlc"
	"github.com/food-on-the-run/server/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserGrantHandler struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewUserGrantHandler(pool *pgxpool.Pool) *UserGrantHandler {
	return &UserGrantHandler{
		pool:    pool,
		queries: db.New(pool),
	}
}

type userGrantDTO struct {
	UserID         int64     `json:"user_id"`
	PermissionID   int64     `json:"permission_id"`
	PermissionCode string    `json:"permission_code"`
	Effect         string    `json:"effect"`
	Scope          *scopeDTO `json:"scope,omitempty"`
	Reason         string    `json:"reason,omitempty"`
	GrantedBy      *int64    `json:"granted_by,omitempty"`
	GrantedAt      string    `json:"granted_at"`
	ExpiresAt      *string   `json:"expires_at,omitempty"`
}

type putUserGrantRequest struct {
	Effect    string    `json:"effect"`
	Scope     *scopeDTO `json:"scope"`
	Reason    string    `json:"reason"`
	ExpiresAt *string   `json:"expires_at"`
}

// ListUserGrants handles GET /api/admin/users/{id}/grants.
// Returns all grant rows (including expired ones) so the admin UI can display history.
func (h *UserGrantHandler) ListUserGrants(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	id, err := parseUserIDPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	if _, err := h.queries.GetUserByID(ctx, id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}
		log.Printf("user grants list: user lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	rows, err := h.queries.ListUserGrants(ctx, id)
	if err != nil {
		log.Printf("user grants list: query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	items := make([]userGrantDTO, 0, len(rows))
	for _, row := range rows {
		items = append(items, grantRowToDTO(row))
	}
	respondJSON(w, http.StatusOK, listEnvelope{Items: items})
}

// PutUserGrant handles PUT /api/admin/users/{id}/grants/{permission_id}.
// Upserts a single grant. The caller's userId is recorded as granted_by.
func (h *UserGrantHandler) PutUserGrant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	userID, err := parseUserIDPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	permID, err := parsePermissionIDFromPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var req putUserGrantRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	effect, err := parseEffect(req.Effect)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	reason := strings.TrimSpace(req.Reason)
	if reason == "" {
		respondError(w, http.StatusBadRequest, "reason is required")
		return
	}
	scopeBytes, err := encodeScopeDTO(req.Scope)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid scope: "+err.Error())
		return
	}
	expiresAt, err := parseOptionalRFC3339(req.ExpiresAt)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid expires_at: "+err.Error())
		return
	}

	ctx := r.Context()
	if _, err := h.queries.GetUserByID(ctx, userID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}
		log.Printf("user grant put: user lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if err := h.queries.UpsertUserGrant(ctx, db.UpsertUserGrantParams{
		UserID:       userID,
		PermissionID: permID,
		Effect:       effect,
		Scope:        scopeBytes,
		Reason:       pgtype.Text{String: reason, Valid: true},
		GrantedBy:    pgtype.Int8{Int64: actor.UserID, Valid: true},
		ExpiresAt:    expiresAt,
	}); err != nil {
		if isForeignKeyViolation(err) {
			respondError(w, http.StatusBadRequest, "unknown permission id")
			return
		}
		log.Printf("user grant put: upsert failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	row, err := h.queries.GetUserGrant(ctx, db.GetUserGrantParams{
		UserID:       userID,
		PermissionID: permID,
	})
	if err != nil {
		log.Printf("user grant put: post-write read failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, grantRowToDTO(db.ListUserGrantsRow(row)))
}

// DeleteUserGrant handles DELETE /api/admin/users/{id}/grants/{permission_id}.
func (h *UserGrantHandler) DeleteUserGrant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID, err := parseUserIDPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	permID, err := parsePermissionIDFromPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.queries.DeleteUserGrant(r.Context(), db.DeleteUserGrantParams{
		UserID:       userID,
		PermissionID: permID,
	}); err != nil {
		log.Printf("user grant delete: query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func parsePermissionIDFromPath(r *http.Request) (int64, error) {
	idStr := r.PathValue("permission_id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid permission id")
	}
	return id, nil
}

func parseEffect(raw string) (int16, error) {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "allow", "grant":
		return 1, nil
	case "deny", "revoke":
		return -1, nil
	}
	return 0, errors.New("effect must be 'allow' or 'deny'")
}

func grantRowToDTO(row db.ListUserGrantsRow) userGrantDTO {
	dto := userGrantDTO{
		UserID:         row.UserID,
		PermissionID:   row.PermissionID,
		PermissionCode: row.PermissionCode,
		Effect:         effectToString(row.Effect),
		Scope:          decodeScopeDTO(row.Scope),
	}
	if row.Reason.Valid {
		dto.Reason = row.Reason.String
	}
	if row.GrantedBy.Valid {
		id := row.GrantedBy.Int64
		dto.GrantedBy = &id
	}
	if row.GrantedAt.Valid {
		dto.GrantedAt = row.GrantedAt.Time.UTC().Format(time.RFC3339)
	}
	if row.ExpiresAt.Valid {
		s := row.ExpiresAt.Time.UTC().Format(time.RFC3339)
		dto.ExpiresAt = &s
	}
	return dto
}

func effectToString(e int16) string {
	if e == -1 {
		return "deny"
	}
	return "allow"
}

func isForeignKeyViolation(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "23503") ||
		strings.Contains(msg, "foreign key")
}

// jsonRawMessageGuard is a small compile-time check that the json package is
// referenced for future scope marshaling; keeps the import graph stable if
// the handler evolves to inline raw JSON payloads.
var _ = json.RawMessage(nil)
