package middlewares

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-secret"

// makeToken signs a token the way the Node backend does (HS256, UserJWT
// claims). Overrides let each case break one thing.
func makeToken(t *testing.T, secret string, mutate func(jwt.MapClaims)) string {
	t.Helper()

	claims := jwt.MapClaims{
		"sub":     "user",
		"id":      "7",
		"email":   "user@example.com",
		"role_id": "2",
		"org_id":  "3",
		"exp":     time.Now().Add(time.Hour).Unix(),
	}
	if mutate != nil {
		mutate(claims)
	}

	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("signing test token: %v", err)
	}
	return signed
}

func TestJWTAuth(t *testing.T) {
	t.Setenv("JWT_SECRET", testSecret)

	cases := []struct {
		name       string
		authHeader string
		wantStatus int
	}{
		{"no header", "", http.StatusUnauthorized},
		{"not bearer", "Basic abc123", http.StatusUnauthorized},
		{"garbage token", "Bearer not.a.jwt", http.StatusUnauthorized},
		{"wrong signature", "Bearer " + makeToken(t, "other-secret", nil), http.StatusUnauthorized},
		{"expired", "Bearer " + makeToken(t, testSecret, func(c jwt.MapClaims) {
			c["exp"] = time.Now().Add(-time.Hour).Unix()
		}), http.StatusUnauthorized},
		{"missing org claim", "Bearer " + makeToken(t, testSecret, func(c jwt.MapClaims) {
			delete(c, "org_id")
		}), http.StatusUnauthorized},
		{"valid", "Bearer " + makeToken(t, testSecret, nil), http.StatusOK},
	}

	t.Run("empty JWT_SECRET fails closed", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "")
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Bearer "+makeToken(t, "", nil))
		rec := httptest.NewRecorder()
		JWTAuth(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {})).ServeHTTP(rec, req)
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("status = %d, want 500", rec.Code)
		}
	})

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var gotUser, gotRole, gotOrg int64

			next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				gotUser = UserID(r.Context())
				gotRole = RoleID(r.Context())
				gotOrg = OrgID(r.Context())
				w.WriteHeader(http.StatusOK)
			})

			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if tc.authHeader != "" {
				req.Header.Set("Authorization", tc.authHeader)
			}
			rec := httptest.NewRecorder()

			JWTAuth(next).ServeHTTP(rec, req)

			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tc.wantStatus)
			}
			if tc.wantStatus == http.StatusOK {
				if gotUser != 7 || gotRole != 2 || gotOrg != 3 {
					t.Fatalf("context = user %d role %d org %d, want 7 2 3", gotUser, gotRole, gotOrg)
				}
			}
		})
	}
}

// The Node backend serialises ids as strings, but a JSON number must work too.
func TestJWTAuthNumericClaims(t *testing.T) {
	t.Setenv("JWT_SECRET", testSecret)

	token := makeToken(t, testSecret, func(c jwt.MapClaims) {
		c["id"], c["role_id"], c["org_id"] = 7, 2, 3
	})

	var gotOrg int64
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotOrg = OrgID(r.Context())
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()

	JWTAuth(next).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK || gotOrg != 3 {
		t.Fatalf("status = %d org = %d, want 200 and 3", rec.Code, gotOrg)
	}
}
