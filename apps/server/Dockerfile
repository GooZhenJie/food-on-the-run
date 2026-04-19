# ---- build stage ----
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download 2>/dev/null || true
RUN go build -o server .

# ---- runtime stage ----
FROM alpine:3.20
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
