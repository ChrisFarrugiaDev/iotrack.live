package handlers

import (
	"encoding/json"
	"net/http"
)

// Health reports service liveness. It is deliberately unauthenticated.
func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "computation.server.go",
	})
}
