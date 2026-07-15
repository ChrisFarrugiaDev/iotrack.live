package services

import "iotrack.live/computation.server.go/internal/appcore"

// Service is the orchestration layer between thin handlers and the
// repositories/engines — the same pattern as teltonika.parser.go's services
// package. One file per section (report_service.go, later alarm/audit);
// services never touch HTTP types.
type Service struct {
	App *appcore.App
}

func NewService(app *appcore.App) *Service {
	return &Service{
		App: app,
	}
}
