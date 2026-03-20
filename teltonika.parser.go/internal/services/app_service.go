package services

import "iotrack.live/teltonika.parser.go/internal/appcore"

type Service struct {
	App *appcore.App
}

func NewService(app *appcore.App) *Service {
	return &Service{
		App: app,
	}
}
