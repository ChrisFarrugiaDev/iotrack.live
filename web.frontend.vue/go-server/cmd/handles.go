package main

import (
	"bytes"
	"html/template"
	"net/http"
	"path/filepath"
)

type VueHandler struct {
}

func (h *VueHandler) ServerIndexWithVariables(w http.ResponseWriter, r *http.Request) {
	data := struct {
		GO_DOCKERIZED bool
		GO_APP_URL    string
		GO_API_PORT   string
	}{
		GO_DOCKERIZED: true,
		GO_APP_URL:    GO_APP_URL,
		GO_API_PORT:   GO_API_PORT,
	}

	filePath := filepath.Join("dist", "index.html")

	tmpl, err := template.ParseFiles(filePath)
	if err != nil {
		http.Error(w, "Failed to load index.html", http.StatusInternalServerError)
		return
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		http.Error(w, "Failed to render page", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}
