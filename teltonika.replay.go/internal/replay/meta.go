package replay

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"maps"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
	"iotrack.live/teltonika.replay.go/internal/logger"
)

type imeiRecord struct {
	hash      string    // hex(SHA-256(real)) — used for ON CONFLICT dedup
	encrypted string    // base64(AES-256-GCM(real)) — decryptable with local key
	firstSeen time.Time
}

// MetaService persists the IMEI masking map and replay progress to the
// replay_meta PostgreSQL schema. Enable with REPLAY_META=true. Real IMEIs
// are never stored in plaintext — only their SHA-256 hash (for dedup) and an
// AES-256-GCM encrypted form (reversible with REPLAY_META_ENCRYPTION_KEY).
type MetaService struct {
	db         *pgxpool.Pool
	encKey     [32]byte
	mu         sync.RWMutex
	imeiMap    map[string]imeiRecord // masked → record, accumulated in memory
	flushEvery time.Duration
}

// NewMetaService builds a MetaService. db may be nil for unit tests (flush
// and progress calls become no-ops).
func NewMetaService(db *pgxpool.Pool, encKey [32]byte, flushEvery time.Duration) *MetaService {
	return &MetaService{
		db:         db,
		encKey:     encKey,
		imeiMap:    make(map[string]imeiRecord),
		flushEvery: flushEvery,
	}
}

// RecordIMEI adds a real→masked pair to the in-memory map. The real IMEI is
// hashed and encrypted immediately; no plaintext real IMEI is retained after
// this call returns. Duplicate entries (same masked IMEI) are ignored.
func (m *MetaService) RecordIMEI(real, masked string) {
	h := sha256.Sum256([]byte(real))
	hexHash := hex.EncodeToString(h[:])

	encrypted, err := encryptAESGCM(m.encKey, real)
	if err != nil {
		logger.Warn("replay meta: failed to encrypt IMEI", zap.Error(err))
		return
	}

	m.mu.Lock()
	if _, exists := m.imeiMap[masked]; !exists {
		m.imeiMap[masked] = imeiRecord{
			hash:      hexHash,
			encrypted: encrypted,
			firstSeen: time.Now().UTC(),
		}
	}
	m.mu.Unlock()
}

// RecordProgress writes one row to replay_meta.replay_progress for each day
// that is loaded (called immediately when a day file is successfully loaded).
func (m *MetaService) RecordProgress(ctx context.Context, fileName string, dayIndex, replayDays int) {
	if m.db == nil {
		return
	}
	_, err := m.db.Exec(ctx,
		`INSERT INTO replay_meta.replay_progress (file_name, day_index, replay_days)
		 VALUES ($1, $2, $3)`,
		fileName, dayIndex, replayDays,
	)
	if err != nil {
		logger.Warn("replay meta: failed to record progress",
			zap.String("file", fileName),
			zap.Int("day_index", dayIndex),
			zap.Error(err),
		)
	}
}

// FlushIMEIMap bulk-upserts the in-memory IMEI map into replay_meta.imei_map.
// Rows are inserted with their first_seen timestamp; subsequent flushes only
// update last_seen. This is the only point where the DB is written for IMEIs.
func (m *MetaService) FlushIMEIMap(ctx context.Context) error {
	if m.db == nil {
		return nil
	}

	m.mu.RLock()
	snapshot := make(map[string]imeiRecord, len(m.imeiMap))
	maps.Copy(snapshot, m.imeiMap)
	m.mu.RUnlock()

	if len(snapshot) == 0 {
		return nil
	}

	for masked, rec := range snapshot {
		_, err := m.db.Exec(ctx,
			`INSERT INTO replay_meta.imei_map
			     (masked_imei, real_imei_hash, real_imei_encrypted, first_seen, last_seen)
			 VALUES ($1, $2, $3, $4, now())
			 ON CONFLICT (masked_imei) DO UPDATE SET last_seen = now()`,
			masked, rec.hash, rec.encrypted, rec.firstSeen,
		)
		if err != nil {
			logger.Warn("replay meta: failed to upsert imei_map",
				zap.String("masked", masked),
				zap.Error(err),
			)
		}
	}

	logger.Debug("replay meta: flushed imei_map", zap.Int("count", len(snapshot)))
	return nil
}

// EnsureSchema creates the replay_meta schema and both tables if they do not
// already exist. Call once at startup when REPLAY_META=true.
func (m *MetaService) EnsureSchema(ctx context.Context) error {
	statements := []string{
		`CREATE SCHEMA IF NOT EXISTS replay_meta`,
		`CREATE TABLE IF NOT EXISTS replay_meta.imei_map (
			masked_imei         TEXT        PRIMARY KEY,
			real_imei_hash      TEXT        NOT NULL UNIQUE,
			real_imei_encrypted TEXT        NOT NULL,
			first_seen          TIMESTAMPTZ NOT NULL DEFAULT now(),
			last_seen           TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,
		`CREATE TABLE IF NOT EXISTS replay_meta.replay_progress (
			id           BIGSERIAL   PRIMARY KEY,
			file_name    TEXT        NOT NULL,
			day_index    INT         NOT NULL,
			replay_days  INT         NOT NULL,
			activated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,
	}
	for _, stmt := range statements {
		if _, err := m.db.Exec(ctx, stmt); err != nil {
			return fmt.Errorf("replay meta schema: %w", err)
		}
	}
	logger.Info("replay meta: schema ready")
	return nil
}

// Run starts the background flush ticker. It flushes once on startup, then on
// every tick, and once more on graceful shutdown (ctx.Done).
func (m *MetaService) Run(ctx context.Context) {
	if err := m.FlushIMEIMap(context.Background()); err != nil {
		logger.Warn("replay meta: startup flush failed", zap.Error(err))
	}

	ticker := time.NewTicker(m.flushEvery)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := m.FlushIMEIMap(ctx); err != nil {
				logger.Warn("replay meta: periodic flush failed", zap.Error(err))
			}
		case <-ctx.Done():
			if err := m.FlushIMEIMap(context.Background()); err != nil {
				logger.Warn("replay meta: shutdown flush failed", zap.Error(err))
			}
			return
		}
	}
}

// DecryptIMEI decrypts a real_imei_encrypted value from replay_meta.imei_map
// using the same key that was used to encrypt it. Useful for reverse lookup.
func DecryptIMEI(key [32]byte, ciphertext string) (string, error) {
	raw, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("base64 decode: %w", err)
	}
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonceSize := gcm.NonceSize()
	if len(raw) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}
	plaintext, err := gcm.Open(nil, raw[:nonceSize], raw[nonceSize:], nil)
	if err != nil {
		return "", fmt.Errorf("decrypt: %w", err)
	}
	return string(plaintext), nil
}

func encryptAESGCM(key [32]byte, plaintext string) (string, error) {
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	sealed := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(sealed), nil
}
