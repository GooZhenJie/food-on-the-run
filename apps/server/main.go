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
	registerRoutes(mux, authHandler, pageSchemaHandler, userHandler)

	handler := middleware.CORS(mux)

	fmt.Printf("Server is running on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func registerRoutes(
	mux *http.ServeMux,
	ah *handlers.AuthHandler,
	ph *handlers.PageSchemaHandler,
	uh *handlers.UserHandler,
) {
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		fmt.Fprintf(w, "Hello, Food on the Run!")
	})

	mux.HandleFunc("/api/auth/register", ah.Register)
	mux.HandleFunc("/api/auth/login", ah.Login)
	mux.HandleFunc("/api/auth/refresh", ah.Refresh)
	mux.HandleFunc("/api/auth/logout", ah.Logout)

	mux.HandleFunc("/api/public/schemas", ph.GetPublished)

	adminMux := http.NewServeMux()
	adminMux.HandleFunc("/api/admin/schemas", ph.AdminSchemas)
	adminMux.HandleFunc("/api/admin/schemas/versions", ph.AdminVersions)
	adminMux.HandleFunc("/api/admin/schemas/publish", ph.AdminPublish)
	adminMux.HandleFunc("GET /api/admin/users", uh.AdminList)
	adminMux.HandleFunc("PATCH /api/admin/users/{id}/role", uh.AdminUpdateRole)

	mux.Handle("/api/admin/", middleware.RequireAuth(middleware.RequireAdmin(adminMux)))
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
