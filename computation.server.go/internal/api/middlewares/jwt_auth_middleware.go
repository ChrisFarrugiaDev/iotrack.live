package middlewares

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/golang-jwt/jwt/v5"
)

// Claims carries the authenticated identity through the request context.
// OrgID is the only trusted source of the active organisation — never the
// request body (design doc §20).
type Claims struct {
	UserID int64
	RoleID int64
	OrgID  int64
}

// Typed context key so the value can't collide with other packages' keys.
type contextKey string

const ctxClaims contextKey = "authClaims"

// AuthClaims returns the identity JWTAuth stored on the request context.
// ok is false when the middleware did not run — callers must treat that as
// an error, never as "org 0".
func AuthClaims(ctx context.Context) (Claims, bool) {
	c, ok := ctx.Value(ctxClaims).(Claims)
	return c, ok
}

// JWTAuth returns a middleware that validates the Bearer token and stores
// Claims on the request context. Ported from file.server.go; extended with
// role/org claims. Like the file server, token_version is not checked — any
// unexpired token is accepted (platform precedent).
//
// The secret is injected once at construction; main refuses to boot without
// one. An empty secret here still fails closed — with "" every forged token
// would verify.
func JWTAuth(secret []byte) func(http.Handler) http.Handler {
	if len(secret) == 0 {
		return func(http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				http.Error(w, "Server auth misconfigured", http.StatusInternalServerError)
			})
		}
	}

	keyfunc := func(*jwt.Token) (any, error) { return secret, nil }

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			authHeader := r.Header.Get("Authorization")
			if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
				http.Error(w, "Missing or invalid token", http.StatusUnauthorized)
				return
			}

			// Validates signature and expiry; only HS256 is accepted, which
			// is what the Node backend signs.
			token, err := jwt.Parse(authHeader[7:], keyfunc,
				jwt.WithValidMethods([]string{"HS256"}))
			if err != nil || !token.Valid {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			mapClaims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}

			// The Node backend issues id, role_id and org_id (UserJWT). All
			// three are required; a token without them is not a platform token.
			userID, err1 := claimInt64(mapClaims["id"])
			roleID, err2 := claimInt64(mapClaims["role_id"])
			orgID, err3 := claimInt64(mapClaims["org_id"])
			if err1 != nil || err2 != nil || err3 != nil {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), ctxClaims, Claims{
				UserID: userID,
				RoleID: roleID,
				OrgID:  orgID,
			})

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// claimInt64 accepts the two encodings JWT JSON can carry for an id:
// a string ("7") or a JSON number (float64).
func claimInt64(v any) (int64, error) {
	switch n := v.(type) {
	case string:
		return strconv.ParseInt(n, 10, 64)
	case float64:
		return int64(n), nil
	default:
		return 0, fmt.Errorf("claim is %T, want string or number", v)
	}
}
