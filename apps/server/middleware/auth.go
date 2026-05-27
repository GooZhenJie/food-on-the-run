package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/food-on-the-run/server/auth"
)

type actorCtxKey struct{}

// ActorFrom returns the Actor stored in ctx by RequireAuth.
// Returns nil when the request has not been authenticated.
func ActorFrom(ctx context.Context) *auth.Actor {
	v, _ := ctx.Value(actorCtxKey{}).(*auth.Actor)
	return v
}

// RequireAuth validates the Authorization bearer token and injects *auth.Actor
// into the request context. Responds 401 on failure.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			writeError(w, http.StatusUnauthorized, "missing bearer token")
			return
		}
		token := strings.TrimPrefix(header, "Bearer ")
		claims, err := auth.ParseAccessToken(token)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}
		actor := auth.ClaimsToActor(claims)
		ctx := context.WithValue(r.Context(), actorCtxKey{}, actor)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequirePersona returns a middleware that ensures the actor belongs to the
// given persona. Must be chained after RequireAuth.
func RequirePersona(persona string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			actor := ActorFrom(r.Context())
			if actor == nil {
				writeError(w, http.StatusUnauthorized, "authentication required")
				return
			}
			if !actor.HasPersona(persona) {
				writeError(w, http.StatusForbidden, persona+" persona required")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireAdmin is a convenience for the admin persona guard.
func RequireAdmin(next http.Handler) http.Handler {
	return RequirePersona(auth.PersonaAdmin)(next)
}

// RequireMerchant is a convenience for the merchant persona guard.
func RequireMerchant(next http.Handler) http.Handler {
	return RequirePersona(auth.PersonaMerchant)(next)
}

// RequireAdminOrMerchant allows both admin and merchant personas through.
// Must be chained after RequireAuth.
func RequireAdminOrMerchant(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		actor := ActorFrom(r.Context())
		if actor == nil {
			writeError(w, http.StatusUnauthorized, "authentication required")
			return
		}
		if !actor.HasPersona(auth.PersonaAdmin) && !actor.HasPersona(auth.PersonaMerchant) {
			writeError(w, http.StatusForbidden, "admin or merchant persona required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RequirePermission is a placeholder for Phase 2; it reads fine today but
// always falls through to Can() which only honors the admin.super short-circuit
// until roles/permissions are populated on the Actor.
func RequirePermission(perm string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			actor := ActorFrom(r.Context())
			if actor == nil {
				writeError(w, http.StatusUnauthorized, "authentication required")
				return
			}
			if !actor.Can(perm) {
				writeError(w, http.StatusForbidden, "missing permission: "+perm)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
