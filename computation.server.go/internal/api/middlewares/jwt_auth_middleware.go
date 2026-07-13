package middlewares

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/golang-jwt/jwt/v5"
)

// Typed context keys so values can't collide with other packages' keys.
type contextKey string

const (
	ctxUserID contextKey = "userID"
	ctxRoleID contextKey = "roleID"
	ctxOrgID  contextKey = "orgID"
)

// UserID returns the authenticated user's id from the request context.
func UserID(ctx context.Context) int64 { v, _ := ctx.Value(ctxUserID).(int64); return v }

// RoleID returns the authenticated user's role id from the request context.
func RoleID(ctx context.Context) int64 { v, _ := ctx.Value(ctxRoleID).(int64); return v }

// OrgID returns the active organisation id from the request context.
// This is the only trusted source of the organisation — never the request
// body (design doc §20).
func OrgID(ctx context.Context) int64 { v, _ := ctx.Value(ctxOrgID).(int64); return v }

// JWTAuth validates the Bearer token on protected routes and puts userID,
// roleID and orgID into the request context. Ported from file.server.go;
// extended with role/org claims. Like the file server, token_version is not
// checked — any unexpired token is accepted (platform precedent).
func JWTAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		authHeader := r.Header.Get("Authorization")
		if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
			http.Error(w, "Missing or invalid token", http.StatusUnauthorized)
			return
		}
		tokenStr := authHeader[7:]

		// Fail closed: with an empty secret every forged token would verify.
		jwtSecret := []byte(os.Getenv("JWT_SECRET"))
		if len(jwtSecret) == 0 {
			http.Error(w, "Server auth misconfigured", http.StatusInternalServerError)
			return
		}

		// Parse and validate signature, algorithm, and expiry.
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// The Node backend issues id, role_id and org_id (UserJWT). All three
		// are required here; a token without them is not a platform token.
		userID, err1 := claimInt64(claims["id"])
		roleID, err2 := claimInt64(claims["role_id"])
		orgID, err3 := claimInt64(claims["org_id"])
		if err1 != nil || err2 != nil || err3 != nil {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), ctxUserID, userID)
		ctx = context.WithValue(ctx, ctxRoleID, roleID)
		ctx = context.WithValue(ctx, ctxOrgID, orgID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// claimInt64 accepts the two encodings JWT JSON can carry for an id:
// a string ("7") or a JSON number (float64).
func claimInt64(v interface{}) (int64, error) {
	switch n := v.(type) {
	case string:
		return strconv.ParseInt(n, 10, 64)
	case float64:
		return int64(n), nil
	default:
		return 0, fmt.Errorf("claim is %T, want string or number", v)
	}
}
