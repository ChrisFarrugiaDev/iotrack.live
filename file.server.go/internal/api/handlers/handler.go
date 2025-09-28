package handlers

import (
	"encoding/json"
	"net/http"

	"iotrack.live/file.server.go/internal/apptypes"
)

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// badRequest builds a typed API error and sends 400.
func badRequest(w http.ResponseWriter, msg, code string, details map[string]any) {
	writeJSON(w, http.StatusBadRequest, apptypes.APIResponse{
		Success: false,
		Message: msg,
		Error: &apptypes.APIError{
			Code:    code,
			Details: details,
		},
	})
}
