package handlers

import (
	"encoding/json"
	"net/http"
)

// Health reports service liveness. It is deliberately unauthenticated.
func Health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "computation.server.go",
	})
}
