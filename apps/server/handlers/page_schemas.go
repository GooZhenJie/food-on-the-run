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

type PageSchemaHandler struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewPageSchemaHandler(pool *pgxpool.Pool) *PageSchemaHandler {
	return &PageSchemaHandler{
		pool:    pool,
		queries: db.New(pool),
	}
}

type pageSchemaDTO struct {
	ID             int64           `json:"id"`
	Key            string          `json:"key"`
	CurrentVersion int32           `json:"current_version"`
	SchemaData     json.RawMessage `json:"schema_data"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
	LastUpdatedBy  *userSummaryDTO `json:"last_updated_by,omitempty"`
}

type userSummaryDTO struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type pageSchemaVersionDTO struct {
	ID           int64           `json:"id"`
	PageSchemaID int64           `json:"page_schema_id"`
	Version      int32           `json:"version"`
	SchemaData   json.RawMessage `json:"schema_data"`
	Note         string          `json:"note"`
	CreatorID    int64           `json:"creator_id"`
	CreatedAt    time.Time       `json:"created_at"`
}

type publishSchemaRequest struct {
	Key        string          `json:"key"`
	SchemaData json.RawMessage `json:"schema_data"`
	Note       string          `json:"note"`
}

type publishSchemaResponse struct {
	Schema          pageSchemaDTO         `json:"schema"`
	NewVersion      pageSchemaVersionDTO  `json:"new_version"`
	PreviousVersion *pageSchemaVersionDTO `json:"previous_version,omitempty"`
}

// GetPublished handles GET /api/public/schemas?key=/home
func (h *PageSchemaHandler) GetPublished(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	key := strings.TrimSpace(r.URL.Query().Get("key"))
	if key == "" {
		respondError(w, http.StatusBadRequest, "key is required")
		return
	}

	schema, err := h.queries.GetPageSchemaByKey(r.Context(), key)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondJSON(w, http.StatusOK, map[string]any{"schema_data": nil})
			return
		}
		log.Printf("schemas: get by key failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, toPageSchemaDTO(schema))
}

// AdminSchemas dispatches /api/admin/schemas by HTTP method:
//   - GET    -> AdminList
//   - DELETE -> AdminDelete
func (h *PageSchemaHandler) AdminSchemas(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.AdminList(w, r)
	case http.MethodDelete:
		h.AdminDelete(w, r)
	default:
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// AdminList handles GET /api/admin/schemas[?key=/home]
func (h *PageSchemaHandler) AdminList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	ctx := r.Context()

	if key := strings.TrimSpace(r.URL.Query().Get("key")); key != "" {
		schema, err := h.queries.GetPageSchemaByKey(ctx, key)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				respondError(w, http.StatusNotFound, "schema not found")
				return
			}
			log.Printf("schemas admin list: get by key failed: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		respondJSON(w, http.StatusOK, toPageSchemaDTO(schema))
		return
	}

	schemas, err := h.queries.ListPageSchemasWithUpdater(ctx)
	if err != nil {
		log.Printf("schemas admin list failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	items := make([]pageSchemaDTO, 0, len(schemas))
	for _, s := range schemas {
		items = append(items, toPageSchemaWithUpdaterDTO(s))
	}
	respondJSON(w, http.StatusOK, map[string]any{"items": items})
}

// AdminVersions handles GET /api/admin/schemas/versions?key=/home[&version=N]
func (h *PageSchemaHandler) AdminVersions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	key := strings.TrimSpace(r.URL.Query().Get("key"))
	if key == "" {
		respondError(w, http.StatusBadRequest, "key is required")
		return
	}

	ctx := r.Context()
	schema, err := h.queries.GetPageSchemaByKey(ctx, key)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "schema not found")
			return
		}
		log.Printf("schemas versions: get schema failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if versionStr := strings.TrimSpace(r.URL.Query().Get("version")); versionStr != "" {
		versionInt, err := strconv.Atoi(versionStr)
		if err != nil || versionInt < 1 {
			respondError(w, http.StatusBadRequest, "invalid version")
			return
		}
		v, err := h.queries.GetPageSchemaVersion(ctx, db.GetPageSchemaVersionParams{
			PageSchemaID: schema.ID,
			Version:      int32(versionInt),
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				respondError(w, http.StatusNotFound, "version not found")
				return
			}
			log.Printf("schemas versions: get version failed: %v", err)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		respondJSON(w, http.StatusOK, toPageSchemaVersionDTO(v))
		return
	}

	versions, err := h.queries.ListPageSchemaVersionsBySchemaID(ctx, schema.ID)
	if err != nil {
		log.Printf("schemas versions: list failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	items := make([]pageSchemaVersionDTO, 0, len(versions))
	for _, v := range versions {
		items = append(items, toPageSchemaVersionDTO(v))
	}
	respondJSON(w, http.StatusOK, map[string]any{"items": items})
}

// AdminDelete handles DELETE /api/admin/schemas?key=/home
func (h *PageSchemaHandler) AdminDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	key := strings.TrimSpace(r.URL.Query().Get("key"))
	if key == "" {
		respondError(w, http.StatusBadRequest, "key is required")
		return
	}

	schema, err := h.queries.SoftDeletePageSchemaByKey(r.Context(), key)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusNotFound, "schema not found")
			return
		}
		log.Printf("schemas delete: soft delete failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, toPageSchemaDTO(schema))
}

// AdminPublish handles POST /api/admin/schemas/publish
func (h *PageSchemaHandler) AdminPublish(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	actor := middleware.ActorFrom(r.Context())
	if actor == nil {
		respondError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	var req publishSchemaRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.Key = strings.TrimSpace(req.Key)
	if req.Key == "" || !strings.HasPrefix(req.Key, "/") {
		respondError(w, http.StatusBadRequest, "key must start with /")
		return
	}
	if len(req.SchemaData) == 0 {
		respondError(w, http.StatusBadRequest, "schema_data is required")
		return
	}
	if !json.Valid(req.SchemaData) {
		respondError(w, http.StatusBadRequest, "schema_data is not valid JSON")
		return
	}

	ctx := r.Context()
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		log.Printf("schemas publish: begin tx failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	defer tx.Rollback(ctx)

	q := h.queries.WithTx(tx)

	var (
		schema          db.PageSchema
		newVersion      int32
		previousVersion *db.PageSchemaVersion
	)

	existing, err := q.GetPageSchemaByKey(ctx, req.Key)
	switch {
	case err == nil:
		newVersion = existing.CurrentVersion + 1
		if existing.CurrentVersion > 0 {
			prev, perr := q.GetPageSchemaVersion(ctx, db.GetPageSchemaVersionParams{
				PageSchemaID: existing.ID,
				Version:      existing.CurrentVersion,
			})
			if perr == nil {
				previousVersion = &prev
			} else if !errors.Is(perr, pgx.ErrNoRows) {
				log.Printf("schemas publish: fetch prev version failed: %v", perr)
				respondError(w, http.StatusInternalServerError, "internal server error")
				return
			}
		}
		updated, uerr := q.UpdatePageSchemaCurrent(ctx, db.UpdatePageSchemaCurrentParams{
			ID:             existing.ID,
			CurrentVersion: newVersion,
			SchemaData:     []byte(req.SchemaData),
		})
		if uerr != nil {
			log.Printf("schemas publish: update current failed: %v", uerr)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		schema = updated
	case errors.Is(err, pgx.ErrNoRows):
		newVersion = 1
		created, cerr := q.CreatePageSchema(ctx, db.CreatePageSchemaParams{
			Key:            req.Key,
			CurrentVersion: newVersion,
			SchemaData:     []byte(req.SchemaData),
		})
		if cerr != nil {
			log.Printf("schemas publish: create failed: %v", cerr)
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		schema = created
	default:
		log.Printf("schemas publish: get failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	version, err := q.CreatePageSchemaVersion(ctx, db.CreatePageSchemaVersionParams{
		PageSchemaID: schema.ID,
		Version:      newVersion,
		SchemaData:   []byte(req.SchemaData),
		Note:         textFromString(req.Note),
		CreatorID:    actor.UserID,
	})
	if err != nil {
		log.Printf("schemas publish: create version failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if err := tx.Commit(ctx); err != nil {
		log.Printf("schemas publish: commit failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	resp := publishSchemaResponse{
		Schema:     toPageSchemaDTO(schema),
		NewVersion: toPageSchemaVersionDTO(version),
	}
	if previousVersion != nil {
		prev := toPageSchemaVersionDTO(*previousVersion)
		resp.PreviousVersion = &prev
	}
	respondJSON(w, http.StatusCreated, resp)
}

func toPageSchemaDTO(s db.PageSchema) pageSchemaDTO {
	return pageSchemaDTO{
		ID:             s.ID,
		Key:            s.Key,
		CurrentVersion: s.CurrentVersion,
		SchemaData:     json.RawMessage(s.SchemaData),
		CreatedAt:      s.CreatedAt.Time,
		UpdatedAt:      s.UpdatedAt.Time,
	}
}

func toPageSchemaWithUpdaterDTO(s db.ListPageSchemasWithUpdaterRow) pageSchemaDTO {
	dto := pageSchemaDTO{
		ID:             s.ID,
		Key:            s.Key,
		CurrentVersion: s.CurrentVersion,
		SchemaData:     json.RawMessage(s.SchemaData),
		CreatedAt:      s.CreatedAt.Time,
		UpdatedAt:      s.UpdatedAt.Time,
	}
	if s.UpdaterID.Valid {
		dto.LastUpdatedBy = &userSummaryDTO{
			ID:    s.UpdaterID.Int64,
			Name:  textOrEmpty(s.UpdaterName),
			Email: textOrEmpty(s.UpdaterEmail),
		}
	}
	return dto
}

func textOrEmpty(t pgtype.Text) string {
	if !t.Valid {
		return ""
	}
	return t.String
}

func toPageSchemaVersionDTO(v db.PageSchemaVersion) pageSchemaVersionDTO {
	note := ""
	if v.Note.Valid {
		note = v.Note.String
	}
	return pageSchemaVersionDTO{
		ID:           v.ID,
		PageSchemaID: v.PageSchemaID,
		Version:      v.Version,
		SchemaData:   json.RawMessage(v.SchemaData),
		Note:         note,
		CreatorID:    v.CreatorID,
		CreatedAt:    v.CreatedAt.Time,
	}
}
