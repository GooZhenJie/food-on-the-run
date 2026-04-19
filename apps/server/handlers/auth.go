package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/food-on-the-run/server/auth"
	db "github.com/food-on-the-run/server/db/sqlc"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthHandler struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewAuthHandler(pool *pgxpool.Pool) *AuthHandler {
	return &AuthHandler{
		pool:    pool,
		queries: db.New(pool),
	}
}

type authUserDTO struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type authResponseDTO struct {
	User         authUserDTO `json:"user"`
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	ExpiresIn    int64       `json:"expires_in"`
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func toUserDTO(u db.User) authUserDTO {
	return authUserDTO{
		ID:    strconv.FormatInt(u.ID, 10),
		Name:  u.Name,
		Email: u.Email,
		Role:  string(u.Role),
	}
}

func textFromString(s string) pgtype.Text {
	trimmed := strings.TrimSpace(s)
	if trimmed == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: trimmed, Valid: true}
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func decodeJSON(r *http.Request, dst any) error {
	defer r.Body.Close()
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

// Register handles POST /api/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req registerRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = normalizeEmail(req.Email)

	if req.Name == "" || req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "name, email and password are required")
		return
	}
	if len(req.Password) < 8 {
		respondError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	ctx := r.Context()

	if _, err := h.queries.GetUserByEmail(ctx, req.Email); err == nil {
		respondError(w, http.StatusConflict, "email already registered")
		return
	} else if !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("register: lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	passwordHash, err := auth.HashPassword(req.Password)
	if err != nil {
		log.Printf("register: bcrypt failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		log.Printf("register: begin tx failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	defer tx.Rollback(ctx)

	q := h.queries.WithTx(tx)

	user, err := q.CreateUser(ctx, db.CreateUserParams{
		Name:  req.Name,
		Email: req.Email,
		Phone: textFromString(req.Phone),
		Role:  db.UserRoleCustomer,
	})
	if err != nil {
		log.Printf("register: create user failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if _, err := q.CreatePasswordCredential(ctx, db.CreatePasswordCredentialParams{
		UserID:       user.ID,
		PasswordHash: pgtype.Text{String: passwordHash, Valid: true},
	}); err != nil {
		log.Printf("register: create credential failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if err := tx.Commit(ctx); err != nil {
		log.Printf("register: commit failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	resp, err := h.issueSession(ctx, user, r)
	if err != nil {
		log.Printf("register: issue session failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusCreated, resp)
}

// Login handles POST /api/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req loginRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Email = normalizeEmail(req.Email)
	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	ctx := r.Context()
	user, err := h.queries.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusUnauthorized, "invalid email or password")
			return
		}
		log.Printf("login: user lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	cred, err := h.queries.GetPasswordCredentialByUserID(ctx, user.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusUnauthorized, "invalid email or password")
			return
		}
		log.Printf("login: credential lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if !cred.PasswordHash.Valid || !auth.VerifyPassword(cred.PasswordHash.String, req.Password) {
		respondError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	if err := h.queries.UpdateAuthCredentialLastLogin(ctx, cred.ID); err != nil {
		log.Printf("login: update last_login failed: %v", err)
	}

	resp, err := h.issueSession(ctx, user, r)
	if err != nil {
		log.Printf("login: issue session failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

// Refresh handles POST /api/auth/refresh with rotation.
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req refreshRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.RefreshToken == "" {
		respondError(w, http.StatusBadRequest, "refresh_token is required")
		return
	}

	ctx := r.Context()
	tokenHash := auth.HashToken(req.RefreshToken)

	session, err := h.queries.GetActiveSessionByTokenHash(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			respondError(w, http.StatusUnauthorized, "invalid or expired refresh token")
			return
		}
		log.Printf("refresh: session lookup failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	user, err := h.queries.GetUserByID(ctx, session.UserID)
	if err != nil {
		log.Printf("refresh: user lookup failed: %v", err)
		respondError(w, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}

	if err := h.queries.RevokeSession(ctx, session.ID); err != nil {
		log.Printf("refresh: revoke old session failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	resp, err := h.issueSession(ctx, user, r)
	if err != nil {
		log.Printf("refresh: issue session failed: %v", err)
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

// Logout handles POST /api/auth/logout — revokes the current session.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req refreshRequest
	_ = decodeJSON(r, &req) // body is optional; token may be in header

	token := req.RefreshToken
	if token == "" {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}
	if token == "" {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	ctx := r.Context()
	session, err := h.queries.GetActiveSessionByTokenHash(ctx, auth.HashToken(token))
	if err != nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if err := h.queries.RevokeSession(ctx, session.ID); err != nil {
		log.Printf("logout: revoke session failed: %v", err)
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) issueSession(ctx context.Context, user db.User, r *http.Request) (authResponseDTO, error) {
	pair, refreshHash, refreshExpiresAt, err := auth.IssueTokenPair(user.ID, string(user.Role))
	if err != nil {
		return authResponseDTO{}, err
	}

	_, err = h.queries.CreateSession(ctx, db.CreateSessionParams{
		UserID:           user.ID,
		RefreshTokenHash: refreshHash,
		UserAgent:        textFromString(r.UserAgent()),
		IpAddress:        nil,
		DeviceID:         pgtype.Text{Valid: false},
		ExpiresAt:        pgtype.Timestamptz{Time: refreshExpiresAt, Valid: true},
	})
	if err != nil {
		return authResponseDTO{}, err
	}

	return authResponseDTO{
		User:         toUserDTO(user),
		AccessToken:  pair.AccessToken,
		RefreshToken: pair.RefreshToken,
		ExpiresIn:    pair.ExpiresIn,
	}, nil
}
