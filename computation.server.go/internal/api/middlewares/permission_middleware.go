package middlewares

import (
	"context"
	"encoding/json"
	"net/http"

	"go.uber.org/zap"

	"iotrack.live/computation.server.go/internal/logger"
)

const rootRoleID int64 = 1

// permissionChecker is satisfied by *repository.AccessRepository. Declared
// here rather than imported from repository so this middleware can be tested
// with a fake, without a real database — the one interface this service
// introduces, and only because this boundary genuinely needs one.
type permissionChecker interface {
	HasPermission(ctx context.Context, userID, roleID int64, key string) (bool, error)
}

// RequirePermission mirrors web.backend.node.ts's requirePermissions:
// role_id 1 bypasses every check; everyone else needs the given key, honoring
// per-user overrides over their role's defaults (see AccessRepository).
// Must run after JWTAuth, which populates the context this reads.
func RequirePermission(repo permissionChecker, key string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			// Root bypass: full access, matching the Node middleware exactly.
			if RoleID(r.Context()) == rootRoleID {
				next.ServeHTTP(w, r)
				return
			}

			allowed, err := repo.HasPermission(r.Context(), UserID(r.Context()), RoleID(r.Context()), key)
			if err != nil {
				logger.Error("permission check failed", zap.Error(err), zap.String("key", key))
				http.Error(w, "Permission check failed", http.StatusInternalServerError)
				return
			}
			if !allowed {
				writePermissionDenied(w, key)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// writePermissionDenied matches the Node backend's 403 shape so the frontend
// (and anything else reading these errors) sees one contract platform-wide.
func writePermissionDenied(w http.ResponseWriter, key string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)

	json.NewEncoder(w).Encode(map[string]any{
		"success": false,
		"message": "Permission denied.",
		"error": map[string]string{
			"code":       "PERMISSION_DENIED",
			"permission": key,
		},
	})
}
