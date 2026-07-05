package replay

import (
	"context"
	"path/filepath"
	"time"

	"go.uber.org/zap"
	"iotrack.live/teltonika.replay.go/internal/logger"
)


// On-missing-file policy values for REPLAY_ON_MISSING_FILE (§6.4).
const (
	OnMissingSkip = "skip" // advance past the missing day (no telemetry that day)
	OnMissingHalt = "halt" // stop the replay loop and report the error
)

// Config is the replay loop configuration, resolved from the environment (§11-12).
type Config struct {
	DataDir       string
	StartFile     string
	Days          int
	PreloadLead   time.Duration
	OnMissingFile string // OnMissingSkip | OnMissingHalt
	Delimiter     string
	Whitelist     Whitelist
	Blacklist     Blacklist
	Meta          *MetaService
	MaxConcurrent int
}

// Rotator drives the daily cycle: load the start file, replay it, then at each
// UTC midnight tick switch to the next day's preloaded file, wrapping after
// Days files (§6).
type Rotator struct {
	cfg       Config
	processor *Processor
	startDate time.Time
	sem       semaphore
	now       func() time.Time // injectable clock (defaults to UTC wall clock)
}

// NewRotator builds a Rotator. The start date is parsed from cfg.StartFile.
func NewRotator(cfg Config, processor *Processor) (*Rotator, error) {
	startDate, err := ParseFileDate(cfg.StartFile)
	if err != nil {
		return nil, err
	}
	return &Rotator{
		cfg:       cfg,
		processor: processor,
		startDate: startDate,
		sem:       newSemaphore(cfg.MaxConcurrent),
		now:       func() time.Time { return time.Now().UTC() },
	}, nil
}

// dateForIndex returns the calendar date for a given day index (§6.3).
func (r *Rotator) dateForIndex(dayIndex int) time.Time {
	return r.startDate.AddDate(0, 0, dayIndex)
}

// pathFor returns the absolute file path for a date.
func (r *Rotator) pathFor(date time.Time) string {
	return filepath.Join(r.cfg.DataDir, FileName(date))
}

// midnightAfter returns the first UTC midnight strictly after t (§6).
func midnightAfter(t time.Time) time.Time {
	return midnightUTC(t).AddDate(0, 0, 1)
}

// loadDay loads the file for dayIndex, anchoring its offset to activationMidnight.
func (r *Rotator) loadDay(ctx context.Context, dayIndex int, activationMidnight time.Time) (*ReplayDay, error) {
	date := r.dateForIndex(dayIndex)
	day, err := LoadReplayDay(r.pathFor(date), date, activationMidnight, r.cfg.Whitelist, r.cfg.Blacklist, r.cfg.Meta, r.cfg.Delimiter)
	if err != nil {
		return nil, err
	}
	if r.cfg.Meta != nil {
		r.cfg.Meta.RecordProgress(ctx, FileName(date), dayIndex, r.cfg.Days)
	}
	return day, nil
}

// emptyDay returns a do-nothing day for a missing file under the skip policy
// (§6.4): the day produces no telemetry but the cycle continues.
func (r *Rotator) emptyDay(dayIndex int, activationMidnight time.Time) *ReplayDay {
	date := r.dateForIndex(dayIndex)
	return &ReplayDay{
		FileDate: midnightUTC(date),
		Offset:   ComputeOffset(date, activationMidnight),
		ByDevice: nil,
	}
}

// Run executes the replay loop until ctx is cancelled (§5-6). It loads the
// start file synchronously, then runs each day's per-device goroutines while
// preloading the next file PreloadLead before midnight and switching at the
// midnight tick.
func (r *Rotator) Run(ctx context.Context) {
	dayIndex := 0

	// First (boot) day activates immediately; its offset anchors to today's
	// midnight so a mid-day start skips the already-past packets (§5.4, §6.1).
	bootMidnight := midnightUTC(r.now())
	day, err := r.loadDay(ctx, dayIndex, bootMidnight)
	if err != nil {
		if r.cfg.OnMissingFile == OnMissingHalt {
			logger.Error("replay: failed to load start file; halting", zap.String("file", r.cfg.StartFile), zap.Error(err))
			return
		}
		logger.Error("replay: failed to load start file; skipping day", zap.String("file", r.cfg.StartFile), zap.Error(err))
		day = r.emptyDay(dayIndex, bootMidnight)
	}

	for {
		logger.Info("replay: activating day",
			zap.Int("day_index", dayIndex),
			zap.String("file", FileName(r.dateForIndex(dayIndex))),
			zap.Duration("offset", day.Offset),
			zap.Int("devices", len(day.ByDevice)),
		)

		// Run the day's goroutines in the background, bound to a per-day context
		// so the midnight switch (or shutdown) cancels them cleanly.
		dayCtx, cancelDay := context.WithCancel(ctx)
		done := make(chan struct{})
		go func(d *ReplayDay) {
			r.processor.RunDay(dayCtx, d, r.sem)
			close(done)
		}(day)

		// Plan the next day.
		nextIndex := (dayIndex + 1) % r.cfg.Days
		nextMidnight := midnightAfter(r.now())
		preloadAt := nextMidnight.Add(-r.cfg.PreloadLead)

		var prepared *ReplayDay
		var preloadErr error
		preloaded := false

		preloadTimer := time.NewTimer(durUntil(r.now(), preloadAt))
		midnightTimer := time.NewTimer(durUntil(r.now(), nextMidnight))

	waitDay:
		for {
			select {
			case <-ctx.Done():
				preloadTimer.Stop()
				midnightTimer.Stop()
				cancelDay()
				<-done
				return
			case <-preloadTimer.C:
				if !preloaded {
					preloaded = true
					logger.Info("replay: preloading next day", zap.Int("day_index", nextIndex), zap.String("file", FileName(r.dateForIndex(nextIndex))))
					prepared, preloadErr = r.loadDay(ctx, nextIndex, nextMidnight)
					if preloadErr != nil {
						logger.Error("replay: preload failed", zap.String("file", FileName(r.dateForIndex(nextIndex))), zap.Error(preloadErr))
					}
				}
			case <-midnightTimer.C:
				break waitDay
			}
		}

		// Midnight tick: stop the current day's goroutines.
		cancelDay()
		<-done

		// Safety: if the preload timer never fired (e.g. lead longer than the
		// time to midnight on a short first day), load now.
		if !preloaded {
			prepared, preloadErr = r.loadDay(ctx, nextIndex, nextMidnight)
		}

		// Apply the missing-file policy.
		if preloadErr != nil {
			if r.cfg.OnMissingFile == OnMissingHalt {
				logger.Error("replay: next file unavailable; halting", zap.String("file", FileName(r.dateForIndex(nextIndex))), zap.Error(preloadErr))
				return
			}
			prepared = r.emptyDay(nextIndex, nextMidnight)
		}

		day = prepared
		dayIndex = nextIndex
	}
}

// durUntil returns a non-negative duration from now to t; if t is already past
// it returns 0 so the timer fires immediately.
func durUntil(now, t time.Time) time.Duration {
	d := t.Sub(now)
	if d < 0 {
		return 0
	}
	return d
}
