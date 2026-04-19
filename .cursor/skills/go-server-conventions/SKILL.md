---
name: go-server-conventions
description: >-
  Enforces Go server conventions for the food-on-the-run backend (apps/server/).
  Use immediately and without exception when:
  1. Adding or modifying an HTTP handler;
  2. Adding a new route;
  3. Creating a new Go package/file under apps/server/;
  4. Adding middleware;
  5. Writing a new SQL query file under db/queries/.
---

# Go Server Conventions — food-on-the-run

## Stack

- Language: Go (stdlib `net/http` — no external HTTP framework)
- DB driver: `pgx/v5` with connection pool (`pgxpool`)
- Migrations: `golang-migrate` → `make migrate-up`
- Query layer: `sqlc` (when added) — never write Go DB structs by hand

---

## Target Directory Structure

`apps/server/` is a **single Go binary** serving both the consumer app
(`apps/web`) and the internal admin console (`apps/admin`). Handlers are split
into audience-scoped packages so that middleware and route prefixes stay clean.

```
apps/server/
├── main.go                  # entry point: wires pool, router, server
├── handlers/
│   ├── response.go          # respondJSON / respondError helpers (shared)
│   ├── public/              # no auth required (health, public catalog)
│   │   └── health.go
│   ├── consumer/            # /api/*        — requires consumer session
│   │   ├── auth.go
│   │   ├── restaurants.go
│   │   └── orders.go
│   └── admin/               # /api/admin/*  — requires admin session + audit
│       ├── restaurants.go   # CRUD + moderation
│       ├── orders.go        # intervention / refunds
│       ├── users.go         # ban / role management
│       ├── payouts.go
│       ├── feature_flags.go
│       └── audit_logs.go
├── services/                # business logic, called by handlers
│   ├── restaurants.go
│   └── orders.go
├── middleware/              # HTTP middleware
│   ├── cors.go
│   ├── session.go           # parses session cookie → *Session in ctx
│   ├── require_consumer.go  # 401 if session.role is not consumer/rider
│   ├── require_admin.go     # 401 if session.role not in (admin, support)
│   └── audit.go             # writes admin write-ops into audit_logs
├── db/
│   ├── migrations/          # source of truth — .sql files
│   ├── queries/             # hand-written SQL for sqlc (ONE file per table)
│   └── sqlc/                # generated — never edit manually
├── Makefile
├── go.mod
└── sqlc.yaml
```

**Rules:**
- `main.go` only contains `main()`, pool setup, migration run, and route wiring — no business logic
- No handler logic in `main.go` — move it to `handlers/<audience>/` immediately
- One handler file per resource per audience (e.g. all `/api/admin/restaurants/*` routes → `handlers/admin/restaurants.go`)
- **`db/queries/` is NOT split by audience** — it mirrors DB tables, consumer and admin handlers both import from the generated `db/sqlc/` package

---

## Handler Conventions

```go
// handlers/consumer/restaurants.go

package consumer

import (
    "net/http"

    "github.com/food-on-the-run/server/handlers"
)

// Handler struct holds shared dependencies injected via constructor.
type RestaurantHandler struct {
    // svc *services.RestaurantService  (add when service layer exists)
}

func NewRestaurantHandler() *RestaurantHandler {
    return &RestaurantHandler{}
}

// GetRestaurants handles GET /api/restaurants
func (h *RestaurantHandler) GetRestaurants(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        handlers.RespondError(w, http.StatusMethodNotAllowed, "method not allowed")
        return
    }
    handlers.RespondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
```

**Rules:**
- Handler functions must be methods on a handler struct, not top-level functions
- Each handler validates HTTP method explicitly
- Handlers never contain SQL — they call a service or a sqlc-generated query
- Handler file name matches the resource: `handlers/consumer/restaurants.go` for `/api/restaurants`, `handlers/admin/restaurants.go` for `/api/admin/restaurants`
- The **same resource** may exist in both packages; they are independent surfaces and must not import each other

---

## Route Registration — Three Audience Groups

All routes are registered in `main.go` through a dedicated `registerRoutes`
function, split into three audience-scoped groups. Each group has its own
middleware chain.

| Prefix | Package | Middleware chain |
|---|---|---|
| `/api/public/*`       | `handlers/public/`   | `CORS` |
| `/api/*` (everything else under `/api/`) | `handlers/consumer/` | `CORS` → `Session` → `RequireConsumer` |
| `/api/admin/*`        | `handlers/admin/`    | `CORS` → `Session` → `RequireAdmin` → `Audit` |

```go
func registerRoutes(
    mux *http.ServeMux,
    consumerRest *consumer.RestaurantHandler,
    adminRest    *admin.RestaurantHandler,
) {
    // consumer
    mux.HandleFunc("/api/restaurants",  consumerRest.List)
    mux.HandleFunc("/api/restaurants/", consumerRest.GetByID)

    // admin
    mux.HandleFunc("/api/admin/restaurants",  adminRest.List)
    mux.HandleFunc("/api/admin/restaurants/", adminRest.GetByID)
}
```

**Rules:**
- Every admin route **must** be registered under `/api/admin/` so that
  `RequireAdmin` + `Audit` middleware automatically applies via prefix match
- Admin handlers **must not** be registered under `/api/` without the
  `/admin` prefix — this bypasses audit logging
- Write operations on admin routes (POST / PUT / PATCH / DELETE) are captured
  by the `Audit` middleware based on method + path; do not dispatch inside a
  handler in a way that hides the real operation

---

## JSON Response Helper

Place this in `handlers/response.go` (exported so that `consumer/` and `admin/`
subpackages can reuse it):

```go
package handlers

import (
    "encoding/json"
    "net/http"
)

func RespondJSON(w http.ResponseWriter, status int, payload any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(payload)
}

func RespondError(w http.ResponseWriter, status int, message string) {
    RespondJSON(w, status, map[string]string{"error": message})
}
```

Subpackages import and call it:

```go
import "github.com/food-on-the-run/server/handlers"

handlers.RespondJSON(w, http.StatusOK, data)
handlers.RespondError(w, http.StatusBadRequest, "invalid id")
```

---

## Error Handling Rules

- Always return structured JSON errors, never plain text (except dev panics)
- Use `handlers.RespondError(w, http.StatusBadRequest, "invalid id")` — never `http.Error()` for API routes
- Log server-side errors with `log.Printf`, do not leak internal details to the client:

```go
// ✅
log.Printf("db query failed: %v", err)
handlers.RespondError(w, http.StatusInternalServerError, "internal server error")

// ❌ leaks internals
handlers.RespondError(w, http.StatusInternalServerError, err.Error())
```

---

## SQL Query Files (sqlc)

- One `.sql` file per table: `db/queries/restaurants.sql`, `db/queries/orders.sql`
- Every query must have a name comment: `-- name: GetRestaurantByID :one`
- After any query or migration change, run: `sqlc generate` (in `apps/server/`)
- **Never edit files under `db/sqlc/`** — they are always regenerated

---

## After Any Change

| What changed | Required action |
|---|---|
| Any `.sql` migration file | `cd apps/server && make migrate-up` |
| Any `db/queries/*.sql` file | `cd apps/server && sqlc generate` |
| New consumer handler | Register under `/api/*` in `registerRoutes` (not under `/api/admin/*`) |
| New admin handler | Register under `/api/admin/*` and verify `Audit` middleware is in the chain |
| New consumer endpoint | Update / create `docs/api/consumer/<resource>.md` |
| New admin endpoint | Update / create `docs/api/admin/<resource>.md` |

---

## Checklist

- [ ] No handler or SQL logic in `main.go`
- [ ] Handler lives in the correct audience package: `handlers/public/`, `handlers/consumer/`, or `handlers/admin/`
- [ ] Handler is a method on a struct, not a top-level function
- [ ] Method guard (`r.Method != ...`) present in every handler
- [ ] JSON responses use `handlers.RespondJSON` / `handlers.RespondError`
- [ ] Errors logged server-side, generic message returned to client
- [ ] New route registered under the correct prefix (`/api/public/*`, `/api/*`, `/api/admin/*`)
- [ ] Admin route chain includes `RequireAdmin` and `Audit`
- [ ] SQL queries in `db/queries/{table}.sql`, one file per table
- [ ] `make migrate-up` run after migration changes
- [ ] `sqlc generate` run after query changes
- [ ] Matching `docs/api/consumer/*.md` or `docs/api/admin/*.md` updated
