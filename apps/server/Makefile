DB_URL ?= postgres://fotr:fotr_secret@localhost:5432/fotr_dev?sslmode=disable

.PHONY: migrate-up migrate-down migrate-drop run sqlc tidy

migrate-up:
	migrate -path db/migrations -database "$(DB_URL)" up

migrate-down:
	migrate -path db/migrations -database "$(DB_URL)" down 1

migrate-drop:
	migrate -path db/migrations -database "$(DB_URL)" drop -f

sqlc:
	sqlc generate

tidy:
	go mod tidy

run:
	go run main.go
