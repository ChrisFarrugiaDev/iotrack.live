package middlewares

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

type fakePermissionChecker struct {
	allowed bool
	err     error
	calls   int
}

func (f *fakePermissionChecker) HasPermission(_ context.Context, _, _ int64, _ string) (bool, error) {
	f.calls++
	return f.allowed, f.err
}

// requestWithClaims builds a request as if JWTAuth already ran, since
// RequirePermission only ever runs behind it.
func requestWithClaims(userID, roleID int64) *http.Request {
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	ctx := context.WithValue(req.Context(), ctxUserID, userID)
	ctx = context.WithValue(ctx, ctxRoleID, roleID)
	return req.WithContext(ctx)
}

func TestRequirePermission(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	t.Run("root role bypasses without consulting the repo", func(t *testing.T) {
		checker := &fakePermissionChecker{allowed: false} // would deny if consulted
		rec := httptest.NewRecorder()

		RequirePermission(checker, "report.view")(next).ServeHTTP(rec, requestWithClaims(1, rootRoleID))

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
		if checker.calls != 0 {
			t.Fatalf("repo consulted %d times, want 0 (root bypass)", checker.calls)
		}
	})

	t.Run("non-root with the permission passes", func(t *testing.T) {
		checker := &fakePermissionChecker{allowed: true}
		rec := httptest.NewRecorder()

		RequirePermission(checker, "report.view")(next).ServeHTTP(rec, requestWithClaims(7, 2))

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	})

	t.Run("non-root without the permission is denied", func(t *testing.T) {
		checker := &fakePermissionChecker{allowed: false}
		rec := httptest.NewRecorder()

		RequirePermission(checker, "report.view")(next).ServeHTTP(rec, requestWithClaims(7, 2))

		if rec.Code != http.StatusForbidden {
			t.Fatalf("status = %d, want 403", rec.Code)
		}

		var body map[string]any
		if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
			t.Fatalf("decoding body: %v", err)
		}
		errObj, _ := body["error"].(map[string]any)
		if errObj["code"] != "PERMISSION_DENIED" || errObj["permission"] != "report.view" {
			t.Fatalf("body = %+v, want PERMISSION_DENIED / report.view", body)
		}
	})

	t.Run("repository error surfaces as 500", func(t *testing.T) {
		checker := &fakePermissionChecker{err: errors.New("db down")}
		rec := httptest.NewRecorder()

		RequirePermission(checker, "report.view")(next).ServeHTTP(rec, requestWithClaims(7, 2))

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("status = %d, want 500", rec.Code)
		}
	})
}
