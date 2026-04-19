package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/food-on-the-run/server/auth"
	db "github.com/food-on-the-run/server/db/sqlc"
	"github.com/food-on-the-run/server/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RoleHandler struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewRoleHandler(pool *pgxpool.Pool) *RoleHandler {
	return &RoleHandler{
		pool:    pool,
		queries: db.New(pool),
	}
}

type roleDTO struct {
	ID              int64    `json:"id"`
	Code            string   `json:"code"`
	Name            string   `json:"name"`
	Persona         string   `json:"persona"`
	IsSystem        bool     `json:"is_system"`
	PermissionCodes []string `json:"permission_codes,omitempty"`
}

type permissionDTO struct {
	ID          int64  `json:"id"`
	Code        string `json:"code"`
	Description string `json:"description,omitempty"`
}

type scopeDTO struct {
	RestaurantIDs []int64  `json:"restaurant_ids,omitempty"`
	CityCodes     []string `json:"city_codes,omitempty"`
}

type roleAssignmentDTO struct {
	RoleID    int64     `json:"role_id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	Persona   string    `json:"persona"`
	IsSystem  bool      `json:"is_system"`
	Scope     *scopeDTO `json:"scope,omitempty"`
	ExpiresAt *string   `json:"expires_at,omitempty"`
}

type putUserRolesRequest struct {
	RoleCodes []string `json:"role_codes"`
}

type createRoleRequest struct {
	Code    string `json:"code"`
	Name    string `json:"name"`
	Persona string `json:"persona"`
}

type updateRoleRequest struct {
	Name string `json:"name"`
}

type putRolePermissionsRequest struct {
	PermissionCodes []string `json:"permission_codes"`
}

type putUserRoleScopeRequest struct {
	Scope     *scopeDTO `json:"scope"`
	ExpiresAt *string   `json:"expires_at"`
}

type listEnvelope struct {
	Items any `json:"items"`
}

// roleCodeRegex limits custom role codes to the same shape as the seed roles:
// lowercase, dot-separated, word-safe. Persona prefix is enforced separately.
var roleCodeRegex = regexp.MustCompile(`^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$`)

// ListRoles handles GET /api/admin/roles. Returns every non-deleted role with
// its permission code list rolled up.
func (h *RoleHandler) ListRoles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	ctx := r.Context()
	rows, err := h.queries.ListRolesWithPermissions(ctx)
	if err != nil {
		log.Printf("roles list: query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	// Aggregate (role_id, permission_code) rows into role DTOs.
	byID := make(map[int64]*roleDTO)
	order := make([]int64, 0)
	for _, row := range rows {
		dto, ok := byID[row.RoleID]
		if !ok {
			dto = &roleDTO{
				ID:       row.RoleID,
				Code:     row.RoleCode,
				Name:     row.RoleName,
				Persona:  string(row.RolePersona),
				IsSystem: row.RoleIsSystem,
			}
			byID[row.RoleID] = dto
			order = append(order, row.RoleID)
		}
		if row.PermissionCode.Valid {
			dto.PermissionCodes = append(dto.PermissionCodes, row.PermissionCode.String)
		}
	}

	items := make([]roleDTO, 0, len(order))
	for _, id := range order {
		items = append(items, *byID[id])
	}
	respondJSON(w, http.StatusOK, listEnvelope{Items: items})
}

// ListPermissions handles GET /api/admin/permissions.
func (h *RoleHandler) ListPermissions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	ctx := r.Context()
	perms, err := h.queries.ListPermissions(ctx)
	if err != nil {
		log.Printf("permissions list: query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	items := make([]permissionDTO, 0, len(perms))
	for _, p := range perms {
		dto := permissionDTO{ID: p.ID, Code: p.Code}
		if p.Description.Valid {
			dto.Description = p.Description.String
		}
		items = append(items, dto)
	}
	respondJSON(w, http.StatusOK, listEnvelope{Items: items})
}

// CreateRole handles POST /api/admin/roles. Creates a custom (is_system=FALSE)
// role bound to a persona. Callers must already be gated behind role:write.
func (h *RoleHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req createRoleRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Code = strings.TrimSpace(strings.ToLower(req.Code))
	req.Name = strings.TrimSpace(req.Name)
	req.Persona = strings.TrimSpace(strings.ToLower(req.Persona))

	if req.Code == "" || req.Name == "" || req.Persona == "" {
		respondError(w, http.StatusBadRequest, "code, name and persona are required")
		return
	}
	if !roleCodeRegex.MatchString(req.Code) {
		respondError(w, http.StatusBadRequest, "invalid role code format")
		return
	}
	persona, ok := toUserRole(req.Persona)
	if !ok {
		respondError(w, http.StatusBadRequest, "invalid persona")
		return
	}
	prefix := string(persona) + "."
	if !strings.HasPrefix(req.Code, prefix) {
		respondError(w, http.StatusBadRequest, "role code must start with persona prefix: "+prefix)
		return
	}

	ctx := r.Context()
	role, err := h.queries.CreateRole(ctx, db.CreateRoleParams{
		Code:    req.Code,
		Name:    req.Name,
		Persona: persona,
	})
	if err != nil {
		if isUniqueViolation(err) {
			respondError(w, http.StatusConflict, "role code already exists")
			return
		}
		log.Printf("roles create: insert failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, toRoleDTO(role))
}

// UpdateRole handles PATCH /api/admin/roles/{id}. Only the display name is
// editable; code and persona are immutable after creation (seeded code
// references are baked into the server).
func (h *RoleHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	id, err := parseRoleIDPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var req updateRoleRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	ctx := r.Context()
	role, err := h.queries.UpdateRoleName(ctx, db.UpdateRoleNameParams{
		ID:   id,
		Name: req.Name,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "role not found")
			return
		}
		log.Printf("roles update: query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, toRoleDTO(role))
}

// DeleteRole handles DELETE /api/admin/roles/{id}. Soft-deletes a custom role.
// System roles (is_system=TRUE) and roles still assigned to users are refused.
func (h *RoleHandler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	id, err := parseRoleIDPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	role, err := h.queries.GetRoleByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "role not found")
			return
		}
		log.Printf("roles delete: lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if role.IsSystem {
		respondError(w, http.StatusBadRequest, "system role cannot be deleted")
		return
	}

	count, err := h.queries.CountUserAssignmentsByRoleID(ctx, id)
	if err != nil {
		log.Printf("roles delete: count assignments failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if count > 0 {
		respondError(w, http.StatusBadRequest, "role still assigned to users")
		return
	}

	if err := h.queries.SoftDeleteRole(ctx, id); err != nil {
		log.Printf("roles delete: soft delete failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// PutRolePermissions handles PUT /api/admin/roles/{id}/permissions. Replaces
// the role's permission set atomically. Must be chained behind role:write.
func (h *RoleHandler) PutRolePermissions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	id, err := parseRoleIDPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var req putRolePermissionsRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	codes := dedupeStrings(req.PermissionCodes)

	ctx := r.Context()
	role, err := h.queries.GetRoleByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "role not found")
			return
		}
		log.Printf("roles put perms: lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	// Validate every code exists; we rely on INSERT-by-code to be no-op for
	// unknown codes but prefer an up-front 400 so the UI sees a clear error.
	for _, c := range codes {
		if _, err := h.queries.GetPermissionByCode(ctx, c); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				respondError(w, http.StatusBadRequest, "unknown permission: "+c)
				return
			}
			log.Printf("roles put perms: perm lookup failed: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
	}

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		log.Printf("roles put perms: begin tx failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	defer tx.Rollback(ctx)

	q := h.queries.WithTx(tx)
	if err := q.DeleteRolePermissions(ctx, role.ID); err != nil {
		log.Printf("roles put perms: delete failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	for _, c := range codes {
		if err := q.AddRolePermissionByCode(ctx, db.AddRolePermissionByCodeParams{
			Column1: role.ID,
			Code:    c,
		}); err != nil {
			log.Printf("roles put perms: add failed: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
	}
	if err := tx.Commit(ctx); err != nil {
		log.Printf("roles put perms: commit failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	dto := toRoleDTO(role)
	sort.Strings(codes)
	dto.PermissionCodes = codes
	respondJSON(w, http.StatusOK, dto)
}

// GetUserRoles handles GET /api/admin/users/{id}/roles.
// Returns role assignments (persona-filtered) with scope + expires_at.
func (h *RoleHandler) GetUserRoles(w http.ResponseWriter, r *http.Request) {
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
		log.Printf("user roles get: user lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	roles, err := h.queries.ListUserRolesDetail(ctx, id)
	if err != nil {
		log.Printf("user roles get: role detail failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	bindings, err := h.queries.ListUserRoleBindings(ctx, id)
	if err != nil {
		log.Printf("user roles get: binding query failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	bindingByID := make(map[int64]db.ListUserRoleBindingsRow, len(bindings))
	for _, b := range bindings {
		bindingByID[b.RoleID] = b
	}

	items := make([]roleAssignmentDTO, 0, len(roles))
	for _, role := range roles {
		dto := roleAssignmentDTO{
			RoleID:   role.ID,
			Code:     role.Code,
			Name:     role.Name,
			Persona:  string(role.Persona),
			IsSystem: role.IsSystem,
		}
		if b, ok := bindingByID[role.ID]; ok {
			dto.Scope = decodeScopeDTO(b.Scope)
			if b.ExpiresAt.Valid {
				s := b.ExpiresAt.Time.UTC().Format(time.RFC3339)
				dto.ExpiresAt = &s
			}
		}
		items = append(items, dto)
	}
	respondJSON(w, http.StatusOK, listEnvelope{Items: items})
}

// PutUserRoles handles PUT /api/admin/users/{id}/roles. Replaces the target
// user's role set atomically. Scope / expires_at on each assignment are reset
// to global/never-expire; use PutUserRoleScope to tighten afterwards.
func (h *RoleHandler) PutUserRoles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	id, err := parseUserIDPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var req putUserRolesRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	codes := dedupeStrings(req.RoleCodes)

	ctx := r.Context()
	user, err := h.queries.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}
		log.Printf("user roles put: user lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	resolved := make([]db.Role, 0, len(codes))
	for _, c := range codes {
		role, err := h.queries.GetRoleByCode(ctx, c)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				respondError(w, http.StatusBadRequest, "unknown role: "+c)
				return
			}
			log.Printf("user roles put: role lookup failed: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		if role.Persona != user.Role {
			respondError(w, http.StatusBadRequest, "role persona mismatch: "+c)
			return
		}
		resolved = append(resolved, role)
	}

	// Prevent self-demotion from super admin to avoid lockout.
	if user.ID == actor.UserID {
		hasSuper := false
		for _, r := range resolved {
			if r.Code == "admin.super" {
				hasSuper = true
				break
			}
		}
		if !hasSuper {
			respondError(w, http.StatusBadRequest, "cannot remove admin.super from yourself")
			return
		}
	}

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		log.Printf("user roles put: begin tx failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	defer tx.Rollback(ctx)

	q := h.queries.WithTx(tx)

	if err := q.DeleteUserRolesByUserID(ctx, user.ID); err != nil {
		log.Printf("user roles put: delete failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	grantedBy := pgtype.Int8{Int64: actor.UserID, Valid: true}
	for _, role := range resolved {
		if err := q.AddUserRole(ctx, db.AddUserRoleParams{
			UserID:    user.ID,
			RoleID:    role.ID,
			GrantedBy: grantedBy,
		}); err != nil {
			log.Printf("user roles put: insert failed: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
	}

	if err := tx.Commit(ctx); err != nil {
		log.Printf("user roles put: commit failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	// Re-read after commit so the response reflects the persisted state.
	assigned, err := h.queries.ListUserRolesDetail(ctx, user.ID)
	if err != nil {
		log.Printf("user roles put: post-commit read failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	items := make([]roleAssignmentDTO, 0, len(assigned))
	for _, role := range assigned {
		items = append(items, roleAssignmentDTO{
			RoleID:   role.ID,
			Code:     role.Code,
			Name:     role.Name,
			Persona:  string(role.Persona),
			IsSystem: role.IsSystem,
		})
	}
	respondJSON(w, http.StatusOK, listEnvelope{Items: items})
}

// PutUserRoleScope handles PUT /api/admin/users/{id}/roles/{role_id}/scope.
// Updates (or creates) the (user, role) assignment's scope + expires_at.
// The role must already match the user's persona.
func (h *RoleHandler) PutUserRoleScope(w http.ResponseWriter, r *http.Request) {
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
	roleID, err := parseRoleIDFromPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var req putUserRoleScopeRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ctx := r.Context()
	user, err := h.queries.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}
		log.Printf("user role scope put: user lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	role, err := h.queries.GetRoleByID(ctx, roleID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "role not found")
			return
		}
		log.Printf("user role scope put: role lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if role.Persona != user.Role {
		respondError(w, http.StatusBadRequest, "role persona mismatch")
		return
	}

	// admin.super must stay global to preserve the emergency short-circuit.
	if role.Code == auth.RoleAdminSuper && req.Scope != nil {
		respondError(w, http.StatusBadRequest, "admin.super must remain global (no scope)")
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

	if err := h.queries.UpsertUserRoleBinding(ctx, db.UpsertUserRoleBindingParams{
		UserID:    user.ID,
		RoleID:    role.ID,
		GrantedBy: pgtype.Int8{Int64: actor.UserID, Valid: true},
		Scope:     scopeBytes,
		ExpiresAt: expiresAt,
	}); err != nil {
		log.Printf("user role scope put: upsert failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	dto := roleAssignmentDTO{
		RoleID:   role.ID,
		Code:     role.Code,
		Name:     role.Name,
		Persona:  string(role.Persona),
		IsSystem: role.IsSystem,
		Scope:    req.Scope,
	}
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		dto.ExpiresAt = req.ExpiresAt
	}
	respondJSON(w, http.StatusOK, dto)
}

func parseUserIDPath(r *http.Request) (int64, error) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		return 0, errInvalidUserID
	}
	return id, nil
}

func parseRoleIDPath(r *http.Request) (int64, error) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		return 0, errInvalidRoleID
	}
	return id, nil
}

// parseRoleIDFromPath reads the {role_id} segment used by nested routes such
// as PUT /api/admin/users/{id}/roles/{role_id}/scope.
func parseRoleIDFromPath(r *http.Request) (int64, error) {
	idStr := r.PathValue("role_id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		return 0, errInvalidRoleID
	}
	return id, nil
}

var (
	errInvalidUserID = errors.New("invalid user id")
	errInvalidRoleID = errors.New("invalid role id")
)

func toRoleDTO(role db.Role) roleDTO {
	return roleDTO{
		ID:       role.ID,
		Code:     role.Code,
		Name:     role.Name,
		Persona:  string(role.Persona),
		IsSystem: role.IsSystem,
	}
}

func dedupeStrings(in []string) []string {
	seen := make(map[string]struct{}, len(in))
	out := make([]string, 0, len(in))
	for _, s := range in {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		if _, ok := seen[s]; ok {
			continue
		}
		seen[s] = struct{}{}
		out = append(out, s)
	}
	return out
}

func decodeScopeDTO(raw []byte) *scopeDTO {
	if len(raw) == 0 {
		return nil
	}
	s := &scopeDTO{}
	if err := json.Unmarshal(raw, s); err != nil {
		return nil
	}
	if s.RestaurantIDs == nil && s.CityCodes == nil {
		return nil
	}
	return s
}

func encodeScopeDTO(s *scopeDTO) ([]byte, error) {
	if s == nil {
		return nil, nil
	}
	if s.RestaurantIDs == nil && s.CityCodes == nil {
		return nil, nil
	}
	return json.Marshal(s)
}

func parseOptionalRFC3339(s *string) (pgtype.Timestamptz, error) {
	if s == nil || *s == "" {
		return pgtype.Timestamptz{Valid: false}, nil
	}
	t, err := time.Parse(time.RFC3339, *s)
	if err != nil {
		return pgtype.Timestamptz{}, err
	}
	return pgtype.Timestamptz{Time: t, Valid: true}, nil
}

// isUniqueViolation detects Postgres unique_violation (SQLSTATE 23505) without
// pulling in pgconn directly — the error string is stable enough for our needs.
func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "23505") ||
		strings.Contains(msg, "duplicate key value")
}
