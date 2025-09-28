package routes

import (
	"github.com/GoWebProd/uuid7"
	"github.com/go-chi/chi/v5"
	"iotrack.live/file.server.go/internal/api/handlers"
	"iotrack.live/file.server.go/internal/api/middlewares"
)

func ImageRouter() chi.Router {
	r := chi.NewRouter()

	imgHandler := &handlers.ImagesHandler{
		Uuid: uuid7.New(),
	}

	r.Use(middlewares.JWTAuthMiddleware)

	r.Post("/uploads", imgHandler.UploadManyImages)

	return r
}
