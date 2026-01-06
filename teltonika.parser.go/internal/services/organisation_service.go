package services

import (
	"encoding/json"
	"fmt"

	"go.uber.org/zap"
	"iotrack.live/internal/logger"
	"iotrack.live/internal/models"
)

func (s *Service) SyncOrganisatiosFromDBToRedis() error {

	organisations, err := s.App.Models.Organisation.GetAll()

	if err != nil {
		logger.Error("failed to get organisations from database", zap.Error(err))
		return fmt.Errorf("failed to get organisations from database: %w", err)
	}

	organisationsMap := make(map[string]*models.Organisation)

	for _, org := range organisations {
		organisationsMap[org.ID] = org
	}

	err = s.App.Cache.ReplaceOrganisationHashWithLua("organisations", organisationsMap, "iotrack.live:")

	if err != nil {
		logger.Error("failed to replace organisations hash in Redis", zap.Error(err))
		return fmt.Errorf("failed to replace organisations hash in Redis: %w", err)
	}

	// Log a summary of the sync
	logger.Debug("Synced org from DB to Redis",
		zap.Int("db_organisations", len(organisations)),
		zap.Int("redis_organisations", len(organisationsMap)),
		zap.String("redis_key", "iotrack.live:organisations"),
	)

	return nil
}

func (s *Service) SyncOrganisationsFromRedisToVar() error {
	items, err := s.App.Cache.HGetAll("organisations", "iotrack.live:")
	if err != nil {
		logger.Error("failed to fetch organisations from Redis", zap.Error(err))
		return fmt.Errorf("failed to fetch organisations from Redis: %w", err)
	}

	organisations := make(map[string]*models.Organisation)
	var unmarshallErrCount int

	for orgID, jsonItem := range items {

		var d models.Organisation
		if err := json.Unmarshal([]byte(jsonItem), &d); err != nil {
			logger.Error("failed to unmarshal organisations from Redis", zap.String("organisation_id", orgID), zap.Error(err))
			unmarshallErrCount++
			continue
		}
		organisations[orgID] = &d
	}

	s.App.OrganisationsLock.Lock()
	s.App.Organisations = organisations
	s.App.OrganisationsLock.Unlock()

	logger.Debug("Org cache loaded from Redis",
		zap.Int("total_organisations", len(items)),
		zap.Int("loaded_organisations", len(organisations)),
		zap.Int("unmarshal_errors", unmarshallErrCount),
	)

	return nil

}
