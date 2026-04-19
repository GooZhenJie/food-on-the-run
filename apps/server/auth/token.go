package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	accessTokenTTL  = 1 * time.Hour
	refreshTokenTTL = 30 * 24 * time.Hour
)

type TokenPair struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int64
}

// AccessClaims is the JWT claim payload for access tokens.
//
// Phase 4 upgrade:
//   - Roles / Permissions remain for backward compatibility: they are the
//     summary "global scope" set derived from RoleBindings + Grants at
//     issue time. Old tokens without RoleBindings / Grants are parsed as
//     v1.0 claims and still work via Actor.Can.
//   - RoleBindings / Grants carry the full resource-scoped authorization
//     data. New handlers that call Actor.CheckResource rely on these.
type AccessClaims struct {
	UserID       int64         `json:"user_id"`
	Persona      string        `json:"persona"`
	Roles        []string      `json:"roles,omitempty"`
	Permissions  []string      `json:"perms,omitempty"`
	Scopes       Scopes        `json:"scopes,omitempty"`
	RoleBindings []RoleClaim   `json:"role_bindings,omitempty"`
	Grants       []GrantClaim  `json:"grants,omitempty"`
	jwt.RegisteredClaims
}

// RoleClaim is the JWT-encoded form of RoleBinding.
// Field names are short to keep token size in check.
type RoleClaim struct {
	Code      string         `json:"c"`
	Persona   string         `json:"pr,omitempty"`
	Scope     *ResourceScope `json:"s,omitempty"`
	ExpiresAt *int64         `json:"x,omitempty"`
	PermCodes []string       `json:"p,omitempty"`
}

// GrantClaim is the JWT-encoded form of Grant.
type GrantClaim struct {
	Perm      string         `json:"p"`
	Effect    int8           `json:"e"`
	Scope     *ResourceScope `json:"s,omitempty"`
	ExpiresAt *int64         `json:"x,omitempty"`
}

func jwtSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Println("WARNING: JWT_SECRET not set; using insecure dev default")
		secret = "dev-insecure-secret-change-me"
	}
	return []byte(secret)
}

// IssueAccessToken signs a JWT access token from an Actor.
func IssueAccessToken(actor *Actor) (string, int64, error) {
	if actor == nil {
		return "", 0, errors.New("actor is required")
	}
	now := time.Now()
	exp := now.Add(accessTokenTTL)
	claims := AccessClaims{
		UserID:       actor.UserID,
		Persona:      actor.Persona,
		Roles:        actor.Roles,
		Permissions:  setToSlice(actor.Permissions),
		Scopes:       actor.Scopes,
		RoleBindings: bindingsToClaims(actor.RoleBindings),
		Grants:       grantsToClaims(actor.Grants),
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(exp),
			Subject:   strconv.FormatInt(actor.UserID, 10),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString(jwtSecret())
	if err != nil {
		return "", 0, err
	}
	return signed, int64(accessTokenTTL.Seconds()), nil
}

func ParseAccessToken(tokenString string) (*AccessClaims, error) {
	parsed, err := jwt.ParseWithClaims(tokenString, &AccessClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return jwtSecret(), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := parsed.Claims.(*AccessClaims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid access token")
	}
	return claims, nil
}

func IssueRefreshToken() (plain string, hash string, expiresAt time.Time, err error) {
	raw := make([]byte, 32)
	if _, err = rand.Read(raw); err != nil {
		return "", "", time.Time{}, err
	}
	plain = base64.RawURLEncoding.EncodeToString(raw)
	hash = HashToken(plain)
	expiresAt = time.Now().Add(refreshTokenTTL)
	return plain, hash, expiresAt, nil
}

func HashToken(plain string) string {
	sum := sha256.Sum256([]byte(plain))
	return hex.EncodeToString(sum[:])
}

// IssueTokenPair issues a JWT access token plus an opaque refresh token for an Actor.
func IssueTokenPair(actor *Actor) (TokenPair, string, time.Time, error) {
	access, expiresIn, err := IssueAccessToken(actor)
	if err != nil {
		return TokenPair{}, "", time.Time{}, err
	}
	refresh, refreshHash, refreshExpiresAt, err := IssueRefreshToken()
	if err != nil {
		return TokenPair{}, "", time.Time{}, err
	}
	return TokenPair{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    expiresIn,
	}, refreshHash, refreshExpiresAt, nil
}

func setToSlice(set map[string]struct{}) []string {
	if len(set) == 0 {
		return nil
	}
	out := make([]string, 0, len(set))
	for k := range set {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

// bindingsToClaims serializes RoleBindings for the JWT payload.
func bindingsToClaims(bindings []RoleBinding) []RoleClaim {
	if len(bindings) == 0 {
		return nil
	}
	out := make([]RoleClaim, 0, len(bindings))
	for _, rb := range bindings {
		claim := RoleClaim{
			Code:      rb.Code,
			Persona:   rb.Persona,
			Scope:     rb.Scope,
			PermCodes: setToSlice(rb.PermSet),
		}
		if rb.ExpiresAt != nil {
			ts := rb.ExpiresAt.Unix()
			claim.ExpiresAt = &ts
		}
		out = append(out, claim)
	}
	return out
}

// grantsToClaims serializes Grants for the JWT payload.
func grantsToClaims(grants []Grant) []GrantClaim {
	if len(grants) == 0 {
		return nil
	}
	out := make([]GrantClaim, 0, len(grants))
	for _, g := range grants {
		claim := GrantClaim{
			Perm:   g.Perm,
			Effect: g.Effect,
			Scope:  g.Scope,
		}
		if g.ExpiresAt != nil {
			ts := g.ExpiresAt.Unix()
			claim.ExpiresAt = &ts
		}
		out = append(out, claim)
	}
	return out
}

// ClaimsToActor rehydrates an Actor from parsed AccessClaims.
// Falls back gracefully when the token was issued before Phase 4 (no
// RoleBindings / Grants): Actor.CheckResource degrades to global-only,
// but Actor.Can continues to honor the legacy Roles / Permissions fields.
func ClaimsToActor(claims *AccessClaims) *Actor {
	if claims == nil {
		return nil
	}
	actor := &Actor{
		UserID:      claims.UserID,
		Persona:     claims.Persona,
		Roles:       claims.Roles,
		Permissions: SliceToSet(claims.Permissions),
		Scopes:      claims.Scopes,
	}
	actor.RoleBindings = claimsToBindings(claims.RoleBindings)
	actor.Grants = claimsToGrants(claims.Grants)
	return actor
}

func claimsToBindings(claims []RoleClaim) []RoleBinding {
	if len(claims) == 0 {
		return nil
	}
	out := make([]RoleBinding, 0, len(claims))
	for _, c := range claims {
		rb := RoleBinding{
			Code:    c.Code,
			Persona: c.Persona,
			Scope:   c.Scope,
			PermSet: SliceToSet(c.PermCodes),
		}
		if c.ExpiresAt != nil {
			t := time.Unix(*c.ExpiresAt, 0)
			rb.ExpiresAt = &t
		}
		out = append(out, rb)
	}
	return out
}

func claimsToGrants(claims []GrantClaim) []Grant {
	if len(claims) == 0 {
		return nil
	}
	out := make([]Grant, 0, len(claims))
	for _, c := range claims {
		g := Grant{
			Perm:   c.Perm,
			Effect: c.Effect,
			Scope:  c.Scope,
		}
		if c.ExpiresAt != nil {
			t := time.Unix(*c.ExpiresAt, 0)
			g.ExpiresAt = &t
		}
		out = append(out, g)
	}
	return out
}
