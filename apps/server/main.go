package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/food-on-the-run/server/handlers"
	"github.com/food-on-the-run/server/middleware"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://fotr:fotr_secret@localhost:5432/fotr_dev?sslmode=disable"
	}

	runMigrations(databaseURL)

	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("database ping failed: %v\n", err)
	}
	fmt.Println("Connected to database")

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	authHandler := handlers.NewAuthHandler(pool)
	pageSchemaHandler := handlers.NewPageSchemaHandler(pool)
	userHandler := handlers.NewUserHandler(pool)
	roleHandler := handlers.NewRoleHandler(pool)
	userGrantHandler := handlers.NewUserGrantHandler(pool)
	merchantHandler := handlers.NewMerchantHandler(pool)
	menuHandler := handlers.NewMenuHandler(pool)
	customerCartHandler := handlers.NewCustomerCartHandler(pool)
	customerOrderHandler := handlers.NewCustomerOrderHandler(pool)
	publicRestaurantHandler := handlers.NewPublicRestaurantHandler(pool)
	dashboardHandler := handlers.NewDashboardHandler()
	registerRoutes(mux, pool, authHandler, pageSchemaHandler, userHandler, roleHandler, userGrantHandler, merchantHandler, menuHandler, customerCartHandler, customerOrderHandler, publicRestaurantHandler, dashboardHandler)

	handler := middleware.CORS(mux)

	fmt.Printf("Server is running on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func registerRoutes(
	mux *http.ServeMux,
	pool *pgxpool.Pool,
	ah *handlers.AuthHandler,
	ph *handlers.PageSchemaHandler,
	uh *handlers.UserHandler,
	rh *handlers.RoleHandler,
	ugh *handlers.UserGrantHandler,
	mh *handlers.MerchantHandler,
	menuH *handlers.MenuHandler,
	cartH *handlers.CustomerCartHandler,
	orderH *handlers.CustomerOrderHandler,
	prh *handlers.PublicRestaurantHandler,
	dh *handlers.DashboardHandler,
) {
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		fmt.Fprintf(w, "Hello, Food on the Run!")
	})

	mux.HandleFunc("POST /api/auth/register", ah.Register)
	mux.HandleFunc("POST /api/auth/login", ah.Login)
	mux.HandleFunc("POST /api/auth/refresh", ah.Refresh)
	mux.HandleFunc("POST /api/auth/logout", ah.Logout)

	mux.HandleFunc("GET /api/public/schemas", ph.GetPublished)
	mux.HandleFunc("GET /api/public/restaurants", prh.List)
	mux.HandleFunc("GET /api/public/restaurants/{id}", prh.GetByID)
	mux.HandleFunc("GET /api/public/restaurants/{id}/menu", menuH.GetRestaurantMenu)

	mux.HandleFunc("GET /api/dashboard/kpi", dh.KPI)
	mux.HandleFunc("GET /api/dashboard/ops-kpi", dh.OpsKPI)
	mux.HandleFunc("GET /api/dashboard/sales-trend", dh.SalesTrend)
	mux.HandleFunc("GET /api/dashboard/category-radar", dh.CategoryRadar)
	mux.HandleFunc("GET /api/dashboard/wordcloud", dh.Wordcloud)
	mux.HandleFunc("GET /api/dashboard/geo", dh.Geo)
	mux.HandleFunc("GET /api/dashboard/dps", dh.DPS)

	// Customer endpoints — require auth.
	customerMux := http.NewServeMux()
	customerMux.HandleFunc("GET /api/customer/cart", cartH.GetCart)
	customerMux.HandleFunc("POST /api/customer/cart/items", cartH.AddCartItem)
	customerMux.HandleFunc("DELETE /api/customer/cart/items/{menu_item_id}", cartH.RemoveCartItem)
	customerMux.HandleFunc("DELETE /api/customer/cart", cartH.ClearCart)
	customerMux.HandleFunc("POST /api/customer/orders", orderH.CreateOrder)
	customerMux.HandleFunc("GET /api/customer/orders", orderH.ListOrders)
	customerMux.HandleFunc("GET /api/customer/orders/{id}", orderH.GetOrder)
	customerMux.HandleFunc("POST /api/customer/orders/{id}/pay", orderH.PayOrder)

	mux.Handle("/api/customer/", middleware.RequireAuth(customerMux))

	adminMux := http.NewServeMux()

	// Read-only admin endpoints — no audit.
	adminMux.HandleFunc("GET /api/admin/schemas", ph.AdminList)
	adminMux.HandleFunc("GET /api/admin/schemas/versions", ph.AdminVersions)
	adminMux.HandleFunc("GET /api/admin/users", uh.AdminList)
	adminMux.HandleFunc("GET /api/admin/users/{id}/scope", uh.AdminGetUserScope)
	adminMux.HandleFunc("GET /api/admin/roles", rh.ListRoles)
	adminMux.HandleFunc("GET /api/admin/permissions", rh.ListPermissions)
	adminMux.HandleFunc("GET /api/admin/users/{id}/roles", rh.GetUserRoles)
	adminMux.HandleFunc("GET /api/admin/users/{id}/grants", ugh.ListUserGrants)

	// Write admin endpoints — audit.
	adminMux.Handle(
		"DELETE /api/admin/schemas",
		middleware.Audit(pool, "schema.delete", "page_schema", middleware.NoResourceID)(
			http.HandlerFunc(ph.AdminDelete),
		),
	)
	adminMux.Handle(
		"POST /api/admin/schemas/publish",
		middleware.Audit(pool, "schema.publish", "page_schema", middleware.NoResourceID)(
			http.HandlerFunc(ph.AdminPublish),
		),
	)
	adminMux.Handle(
		"PATCH /api/admin/users/{id}/role",
		middleware.Audit(pool, "user.persona_change", "user", middleware.PathValueID("id"))(
			http.HandlerFunc(uh.AdminUpdateRole),
		),
	)
	adminMux.Handle(
		"PUT /api/admin/users/{id}/roles",
		middleware.RequirePermission("role:write")(
			middleware.Audit(pool, "user.roles_replace", "user", middleware.PathValueID("id"))(
				http.HandlerFunc(rh.PutUserRoles),
			),
		),
	)

	// Role CRUD — gated behind role:write.
	adminMux.Handle(
		"POST /api/admin/roles",
		middleware.RequirePermission("role:write")(
			middleware.Audit(pool, "role.create", "rbac", middleware.NoResourceID)(
				http.HandlerFunc(rh.CreateRole),
			),
		),
	)
	adminMux.Handle(
		"PATCH /api/admin/roles/{id}",
		middleware.RequirePermission("role:write")(
			middleware.Audit(pool, "role.update", "rbac", middleware.PathValueID("id"))(
				http.HandlerFunc(rh.UpdateRole),
			),
		),
	)
	adminMux.Handle(
		"DELETE /api/admin/roles/{id}",
		middleware.RequirePermission("role:write")(
			middleware.Audit(pool, "role.delete", "rbac", middleware.PathValueID("id"))(
				http.HandlerFunc(rh.DeleteRole),
			),
		),
	)
	adminMux.Handle(
		"PUT /api/admin/roles/{id}/permissions",
		middleware.RequirePermission("role:write")(
			middleware.Audit(pool, "role.permissions_update", "rbac", middleware.PathValueID("id"))(
				http.HandlerFunc(rh.PutRolePermissions),
			),
		),
	)
	adminMux.Handle(
		"PUT /api/admin/users/{id}/roles/{role_id}/scope",
		middleware.RequirePermission("role:write")(
			middleware.Audit(pool, "user_role.scope_update", "rbac", middleware.PathValueID("id"))(
				http.HandlerFunc(rh.PutUserRoleScope),
			),
		),
	)

	// User-level permission overrides (grants) — gated behind role:write.
	adminMux.Handle(
		"PUT /api/admin/users/{id}/grants/{permission_id}",
		middleware.RequirePermission("role:write")(
			middleware.Audit(pool, "user_grant.upsert", "rbac", middleware.PathValueID("id"))(
				http.HandlerFunc(ugh.PutUserGrant),
			),
		),
	)
	adminMux.Handle(
		"DELETE /api/admin/users/{id}/grants/{permission_id}",
		middleware.RequirePermission("role:write")(
			middleware.Audit(pool, "user_grant.delete", "rbac", middleware.PathValueID("id"))(
				http.HandlerFunc(ugh.DeleteUserGrant),
			),
		),
	)

	mux.Handle("/api/admin/", middleware.RequireAuth(middleware.RequireAdmin(adminMux)))

	merchantMux := http.NewServeMux()
	merchantMux.HandleFunc("GET /api/merchant/restaurants", mh.ListMyRestaurants)
	merchantMux.HandleFunc("GET /api/merchant/restaurants/{id}", mh.GetMyRestaurant)
	merchantMux.HandleFunc("GET /api/merchant/orders", mh.ListMyOrders)
	merchantMux.Handle(
		"PATCH /api/merchant/orders/{id}/status",
		middleware.Audit(pool, "order.status_change", "order", middleware.PathValueID("id"))(
			http.HandlerFunc(mh.UpdateOrderStatus),
		),
	)

	mux.Handle("/api/merchant/", middleware.RequireAuth(middleware.RequireMerchant(merchantMux)))
}

func runMigrations(databaseURL string) {
	m, err := migrate.New("file://db/migrations", databaseURL)
	if err != nil {
		log.Fatalf("migration init failed: %v\n", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("migration failed: %v\n", err)
	}
	fmt.Println("Migrations applied")
}
