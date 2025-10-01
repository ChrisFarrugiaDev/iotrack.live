package routes

import (
	"github.com/GoWebProd/uuid7"
	"github.com/go-chi/chi/v5"
	"iotrack.live/file.server.go/internal/api/handlers"
	"iotrack.live/file.server.go/internal/api/middlewares"
)

func ImageRouter() chi.Router {
	r := chi.NewRouter()

	h := &handlers.ImagesHandler{
		Uuid: uuid7.New(),
	}

	// Public (no JWT): serve + list
	// r.Get("/{id}", h.ServeByID) // binary image
	// r.Head("/{id}", h.ServeByID)
	r.Get("/{entity_type}/{entity_id}/{img_file}", h.ServeByPath)
	r.Head("/{entity_type}/{entity_id}/{img_file}", h.ServeByPath)

	// Auth-protected group for mutating endpoints
	r.Group(func(auth chi.Router) {

		auth.Use(middlewares.JWTAuthMiddleware)

		auth.Get("/list", h.List) // GET /img?entity_type=asset&entity_id=74&page=1&limit=20

		// Upload many (multipart/form-data)
		auth.Post("/upload", h.UploadMany)

		// Bulk delete by entity (JSON body)
		auth.Delete("/delete", h.DeleteMany)

		// Delete one by id
		auth.Delete("/delete/{id}", h.DeleteOne)
	})

	return r
}
