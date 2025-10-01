package middlewares

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

// JWTAuthMiddleware validates JWT Bearer tokens on protected routes
func JWTAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Get the Authorization header from the request
		authHeader := r.Header.Get("Authorization")

		// Check that the header is present and properly formatted ("Bearer <token>")
		if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
			http.Error(w, "Missing or invalid token", http.StatusUnauthorized)
			return
		}

		// Extract the token string after "Bearer "
		tokenStr := authHeader[7:]

		// Load the JWT secret from environment variable
		jwtSecret := []byte(os.Getenv("JWT_SECRET"))

		// Parse the JWT and validate its signing method and signature
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			// Only accept tokens signed with HMAC (HS256/HS512/etc)
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return jwtSecret, nil
		})

		// If parsing or validation fails, block the request
		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Parse claims (payload) and check that user_id exists
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["id"] == nil {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// Add user_id to the request context so it can be accessed in handlers
		ctx := context.WithValue(r.Context(), "userID", claims["id"])
		r = r.WithContext(ctx)

		// Continue to the next handler
		next.ServeHTTP(w, r)
	})
}

// In your handlers, get user_id with:
// userID := r.Context().Value(userIDKey)
