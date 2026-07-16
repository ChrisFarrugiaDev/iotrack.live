package handlers

import (
	"encoding/json"
	"net/http"
)

// The platform response envelope (§34): success responses carry data, error
// responses carry a message and a machine-readable code. The frontend reads
// res.data.data on success and error.code on failure, so these shapes are a
// contract with web.frontend.vue, not a style choice.

func writeData(w http.ResponseWriter, status int, data any) {
	writeJSON(w, status, map[string]any{
		"success": true,
		"data":    data,
	})
}

func writeError(w http.ResponseWriter, status int, message, code string) {
	writeJSON(w, status, map[string]any{
		"success": false,
		"message": message,
		"error":   map[string]string{"code": code},
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}
