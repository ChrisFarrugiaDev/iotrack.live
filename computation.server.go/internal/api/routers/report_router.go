package routers

import (
	"github.com/go-chi/chi/v5"

	"iotrack.live/computation.server.go/internal/api/handlers"
	"iotrack.live/computation.server.go/internal/api/middlewares"
	"iotrack.live/computation.server.go/internal/appcore"
	"iotrack.live/computation.server.go/internal/services"
)

// ReportRouter mounts the reports section: JWT then permission on every
// route, handlers built on the services layer.
func ReportRouter(app *appcore.App) chi.Router {
	r := chi.NewRouter()

	r.Use(middlewares.JWTAuth)
	r.Use(middlewares.RequirePermission(app.Repo.Access, "report.view"))

	service := services.NewService(app)
	reportHandler := handlers.NewReportHandler(service, app.Config.ReportMaxConcurrent)

	r.Post("/activity", reportHandler.ActivityReport)

	return r
}
