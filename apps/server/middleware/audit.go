package middleware

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/food-on-the-run/server/auth"
	db "github.com/food-on-the-run/server/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ResourceIDResolver extracts the target resource id from the request. Called
// AFTER the handler runs, so path values and body have already been parsed.
type ResourceIDResolver func(*http.Request) int64

// PathValueID returns a resolver that reads r.PathValue(name) as int64.
// Returns 0 on parse failure (audit row is still written with resource_id NULL).
func PathValueID(name string) ResourceIDResolver {
	return func(r *http.Request) int64 {
		v := r.PathValue(name)
		id, err := strconv.ParseInt(v, 10, 64)
		if err != nil || id <= 0 {
			return 0
		}
		return id
	}
}

// NoResourceID marks the target resource id as unknown (e.g. DELETE by query
// param where the row id is never on the wire).
func NoResourceID(*http.Request) int64 { return 0 }

// Audit records an audit_logs row when the wrapped handler responds with 2xx.
// Must be chained AFTER RequireAuth so ActorFrom(ctx) is populated.
func Audit(pool *pgxpool.Pool, action, resourceType string, resolveID ResourceIDResolver) func(http.Handler) http.Handler {
	q := db.New(pool)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			sw := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(sw, r)
			if sw.status < 200 || sw.status >= 300 {
				return
			}
			actor := ActorFrom(r.Context())
			var resourceID int64
			if resolveID != nil {
				resourceID = resolveID(r)
			}
			writeAuditAsync(q, actor, action, resourceType, resourceID, r.UserAgent())
		})
	}
}

func writeAuditAsync(q *db.Queries, actor *auth.Actor, action, resourceType string, resourceID int64, userAgent string) {
	params := db.WriteAuditLogParams{
		Action:       action,
		ResourceType: resourceType,
		UserAgent:    textOrNull(userAgent),
		MetaData:     []byte("{}"),
	}
	if actor != nil {
		if actor.UserID > 0 {
			params.ActorID = pgtype.Int8{Int64: actor.UserID, Valid: true}
		}
		if actor.Persona != "" {
			params.ActorRole = db.NullUserRole{UserRole: db.UserRole(actor.Persona), Valid: true}
		}
	}
	if resourceID > 0 {
		params.ResourceID = pgtype.Int8{Int64: resourceID, Valid: true}
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if err := q.WriteAuditLog(ctx, params); err != nil {
			log.Printf("audit: write failed action=%s resource=%s id=%d err=%v",
				action, resourceType, resourceID, err)
		}
	}()
}

func textOrNull(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: s, Valid: true}
}

// statusRecorder wraps http.ResponseWriter to capture the response status.
// Default 200 because handlers that skip WriteHeader implicitly return 200.
type statusRecorder struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (sr *statusRecorder) WriteHeader(code int) {
	if !sr.wroteHeader {
		sr.status = code
		sr.wroteHeader = true
	}
	sr.ResponseWriter.WriteHeader(code)
}

func (sr *statusRecorder) Write(b []byte) (int, error) {
	if !sr.wroteHeader {
		sr.wroteHeader = true
	}
	return sr.ResponseWriter.Write(b)
}
