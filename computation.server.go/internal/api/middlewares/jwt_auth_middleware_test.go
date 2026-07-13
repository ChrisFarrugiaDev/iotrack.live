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
// claims). mutate lets each case break one thing.
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
		{"valid, string ids", "Bearer " + makeToken(t, testSecret, nil), http.StatusOK},
		// The Node backend serialises ids as strings, but JSON numbers must
		// work too.
		{"valid, numeric ids", "Bearer " + makeToken(t, testSecret, func(c jwt.MapClaims) {
			c["id"], c["role_id"], c["org_id"] = 7, 2, 3
		}), http.StatusOK},
	}

	middleware := JWTAuth([]byte(testSecret))

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var got Claims
			var gotOK bool

			next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				got, gotOK = AuthClaims(r.Context())
				w.WriteHeader(http.StatusOK)
			})

			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if tc.authHeader != "" {
				req.Header.Set("Authorization", tc.authHeader)
			}
			rec := httptest.NewRecorder()

			middleware(next).ServeHTTP(rec, req)

			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tc.wantStatus)
			}
			if tc.wantStatus == http.StatusOK {
				want := Claims{UserID: 7, RoleID: 2, OrgID: 3}
				if !gotOK || got != want {
					t.Fatalf("claims = %+v ok=%v, want %+v", got, gotOK, want)
				}
			}
		})
	}
}

// An empty secret must never verify anything — the middleware fails closed
// even if main's boot check is somehow bypassed.
func TestJWTAuthEmptySecretFailsClosed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer x")
	rec := httptest.NewRecorder()

	JWTAuth(nil)(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("next handler must not run")
	})).ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
}

// AuthClaims must report absence loudly, not hand back a zero org id.
func TestAuthClaimsAbsent(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)

	if _, ok := AuthClaims(req.Context()); ok {
		t.Fatal("ok = true on a context without claims")
	}
}
