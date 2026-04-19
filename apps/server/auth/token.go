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

type AccessClaims struct {
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func jwtSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Println("WARNING: JWT_SECRET not set; using insecure dev default")
		secret = "dev-insecure-secret-change-me"
	}
	return []byte(secret)
}

func IssueAccessToken(userID int64, role string) (string, int64, error) {
	now := time.Now()
	exp := now.Add(accessTokenTTL)
	claims := AccessClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(exp),
			Subject:   strconv.FormatInt(userID, 10),
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

func IssueTokenPair(userID int64, role string) (TokenPair, string, time.Time, error) {
	access, expiresIn, err := IssueAccessToken(userID, role)
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
