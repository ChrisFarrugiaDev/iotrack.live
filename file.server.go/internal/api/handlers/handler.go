package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"iotrack.live/file.server.go/internal/apptypes"
)

// ---------------------------------------------------------------------
// response helper func

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

// ---------------------------------------------------------------------
// wrapper helper func

func parsePositiveIntOrDefault(s string, def int) (int, error) {
	if strings.TrimSpace(s) == "" {
		return def, nil
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0, err
	}
	return n, nil
}

func sanitizeFilenameForHeader(name string) string {
	// keep simple & safe
	name = strings.ReplaceAll(name, `"`, "")  // strip quotes
	name = strings.ReplaceAll(name, "\n", "") // strip newlines
	name = strings.ReplaceAll(name, "\r", "")
	return name
}

// ---------------------------------------------------------------------
