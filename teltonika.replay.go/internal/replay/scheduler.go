package replay

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"sync"
	"time"

	"go.uber.org/zap"
	"iotrack.live/teltonika.replay.go/internal/appcore"
	"iotrack.live/teltonika.replay.go/internal/apptypes"
	"iotrack.live/teltonika.replay.go/internal/cache"
	"iotrack.live/teltonika.replay.go/internal/logger"
	"iotrack.live/teltonika.replay.go/internal/models"
	"iotrack.live/teltonika.replay.go/internal/services"
	"iotrack.live/teltonika.replay.go/internal/teltonika"
	"iotrack.live/teltonika.replay.go/internal/util"
)

// CRC mode values for REPLAY_CRC_MODE (§7.3).
const (
	CRCModeWarn   = "warn"   // log the failure, keep/publish the packet (default)
	CRCModeReject = "reject" // log the failure, drop the packet
)

// codec8ID is the only codec this service replays (§7.2).
const codec8ID = 0x08

// fireGrace lets a packet whose scheduled time is at most this far in the past
// still fire immediately instead of being skipped. It absorbs the few
// milliseconds of timer + goroutine-launch jitter at the midnight switch so the
// 00:00:00 packet of a freshly activated day is not dropped (§5.2 vs §6.3),
// while still skipping the genuinely past-due packets of a mid-day startup.
const fireGrace = time.Second

// Processor performs the fire-time work for one packet: codec dispatch, parse,
// CRC validation, offset application, dedup, and publishing — reusing the live
// parser's downstream contracts exactly (§7).
type Processor struct {
	App     *appcore.App
	Service *services.Service
	CRCMode string // CRCModeWarn | CRCModeReject
	// DryRun runs the full pipeline (load, parse, CRC, offset, schedule) but
	// makes NO external writes: no RabbitMQ publish, no Redis pub/sub, no
	// latest-telemetry update, and no unknown-device creation. Each fired packet
	// is logged instead. Used to validate a replay against shared infra before
	// emitting real telemetry (SPEC §7.6).
	DryRun bool
}

// NewProcessor builds a Processor, defaulting an unknown CRC mode to warn.
func NewProcessor(app *appcore.App, svc *services.Service, crcMode string, dryRun bool) *Processor {
	if crcMode != CRCModeReject {
		crcMode = CRCModeWarn
	}
	return &Processor{App: app, Service: svc, CRCMode: crcMode, DryRun: dryRun}
}

// semaphore bounds simultaneously active (parsing/publishing) device work. A nil
// semaphore is unbounded (REPLAY_MAX_CONCURRENT_DEVICES=0, §5.3).
type semaphore chan struct{}

func newSemaphore(n int) semaphore {
	if n <= 0 {
		return nil
	}
	return make(semaphore, n)
}

func (s semaphore) acquire() {
	if s != nil {
		s <- struct{}{}
	}
}

func (s semaphore) release() {
	if s != nil {
		<-s
	}
}

// RunDay launches one goroutine per device for the day and blocks until every
// device finishes (end of day) or ctx is cancelled (§5.1 steps 5-6).
func (p *Processor) RunDay(ctx context.Context, day *ReplayDay, sem semaphore) {
	if day == nil || len(day.ByDevice) == 0 {
		return
	}
	var wg sync.WaitGroup
	for imei, packets := range day.ByDevice {
		wg.Add(1)
		go func(imei string, packets []ReplayPacket) {
			defer wg.Done()
			p.runDevice(ctx, imei, packets, day.Offset, sem)
		}(imei, packets)
	}
	wg.Wait()
}

// runDevice resolves the device once, then walks its sorted packets on the
// wall-clock schedule, processing each at fire time (§5.2).
func (p *Processor) runDevice(ctx context.Context, imei string, packets []ReplayPacket, offset time.Duration, sem semaphore) {
	device, ok := p.resolveDevice(imei)
	if !ok {
		return
	}
	scheduleDevice(ctx, packets, offset, func(pkt ReplayPacket) {
		sem.acquire()
		defer sem.release()
		p.processPacket(ctx, device, pkt, offset)
	})
}

// scheduleDevice walks packets in order, sleeping (interruptibly) until each
// packet's scheduled wall-clock time (HappenedAt+offset), then invokes fire.
// Past-due packets (beyond fireGrace) are skipped — never back-filled, never
// sent before their time (§5.2, §5.4). This is the pure scheduling core, with
// no parsing/publishing, so it is unit-testable on its own.
func scheduleDevice(ctx context.Context, packets []ReplayPacket, offset time.Duration, fire func(ReplayPacket)) {
	for i := range packets {
		select {
		case <-ctx.Done():
			return
		default:
		}

		wait := time.Until(packets[i].HappenedAt.Add(offset))
		if wait < -fireGrace {
			continue // genuinely past-due → skip
		}
		if wait > 0 {
			timer := time.NewTimer(wait)
			select {
			case <-ctx.Done():
				timer.Stop()
				return
			case <-timer.C:
			}
		}
		fire(packets[i])
	}
}

// resolveDevice looks up the IMEI in app.Devices, creating an unknown device
// (status=new) exactly as the live parser does (§7.1, minus the handshake).
// Disabled/retired devices are skipped (no error).
func (p *Processor) resolveDevice(imei string) (*models.Device, bool) {
	p.App.DevicesLock.RLock()
	device, ok := p.App.Devices[imei]
	p.App.DevicesLock.RUnlock()

	if ok && device != nil {
		if device.Status == "disabled" || device.Status == "retired" {
			logger.Debug("replay: skipping device", zap.String("imei", imei), zap.String("status", device.Status))
			return nil, false
		}
		return device, true
	}

	// Dry run: never create devices; treat the unknown IMEI as skipped (§7.6).
	if p.DryRun {
		logger.Info("replay[dry-run]: would create unknown device (skipping)", zap.String("imei", imei))
		return nil, false
	}

	// Unknown device: create with vendor teltonika, status new (§7.1).
	newDevice := &models.Device{ExternalID: imei, ExternalIDType: "imei"}
	vendor := "teltonika"
	newDevice.Vendor = &vendor
	newDevice.UUID = p.App.UUID.Next().String()
	newDevice.Status = "new"
	newDevice.Protocol = "4G"

	created, err := p.App.Models.Device.Create(newDevice)
	if err != nil {
		logger.Error("replay: failed to create device", zap.String("imei", imei), zap.Error(err))
		return nil, false
	}
	if err := p.App.Cache.HSet("devices", imei, created, "iotrack.live:"); err != nil {
		logger.Error("replay: failed to cache new device", zap.String("imei", imei), zap.Error(err))
	}
	p.App.DevicesLock.Lock()
	p.App.Devices[imei] = created
	p.App.DevicesLock.Unlock()

	return created, true
}

// processPacket runs the fire-time pipeline for a single packet (§7.2-7.5):
// codec dispatch, Codec 8 parse, CRC validation, offset application, then
// publish.
func (p *Processor) processPacket(ctx context.Context, device *models.Device, pkt ReplayPacket, offset time.Duration) {
	// Codec dispatch: codec ID is at byte 8; only Codec 8 is supported (§7.2).
	if len(pkt.Raw) < 9 {
		logger.Warn("replay: packet too short for codec id", zap.String("imei", pkt.IMEI), zap.Int("len", len(pkt.Raw)))
		return
	}
	if pkt.Raw[8] != codec8ID {
		logger.Warn("replay: unsupported codec id", zap.String("imei", pkt.IMEI), zap.Int("codec_id", int(pkt.Raw[8])))
		return
	}

	record, err := teltonika.ParseCodec8(pkt.Raw)
	if err != nil {
		logger.Warn("replay: codec 8 parse error", zap.String("imei", pkt.IMEI), zap.Error(err))
		return
	}

	// CRC-16/IBM over the data field (bytes 8..len-4), against original bytes (§7.3).
	if !validCodec8CRC(pkt.Raw, record.CRC) {
		logger.Warn("replay: CRC validation failed",
			zap.String("imei", pkt.IMEI),
			zap.String("mode", p.CRCMode),
			zap.String("raw", hex.EncodeToString(pkt.Raw)),
		)
		if p.CRCMode == CRCModeReject {
			return
		}
	}

	// Strategy A: shift parsed timestamps by the whole-day offset (§4.2-4.3).
	for i := range record.Content.AVL_Datas {
		if err := ApplyOffset(&record.Content.AVL_Datas[i], offset); err != nil {
			logger.Warn("replay: failed to apply offset", zap.String("imei", pkt.IMEI), zap.Error(err))
		}
	}

	// Dry run: log what would be published and make no external writes (§7.6).
	if p.DryRun {
		first := record.Content.AVL_Datas[0]
		logger.Info("replay[dry-run]: would publish",
			zap.String("imei", pkt.IMEI),
			zap.Int64("device_id", device.ID),
			zap.String("happened_at", first.HappenedAt),
			zap.Int("records", len(record.Content.AVL_Datas)),
		)
		return
	}

	p.publish(ctx, device, record)
}

// validCodec8CRC recomputes CRC-16/IBM over the Teltonika data field — codec ID
// through the second quantity, i.e. bytes [8 : len-4] — and compares it to the
// packet's trailing CRC. The original parser only read the field; the replay
// layer verifies it (§7.3, §16.3).
func validCodec8CRC(raw []byte, packetCRC uint32) bool {
	if len(raw) < 12 { // 8 header + at least 4 CRC
		return false
	}
	want := uint16(packetCRC)
	got := util.Crc16IBM(raw[8 : len(raw)-4])
	return got == want
}

// publish mirrors the live parser's TCP handler exactly so the RabbitMQ body,
// Redis latest-telemetry, and teltonika:live payload stay byte-identical
// (§7.5, §16). Every AVL record is sent to RabbitMQ; only the first record (the
// most recent in the packet) drives the LastTsMap dedup, latest-telemetry
// merge, and live pub/sub.
func (p *Processor) publish(ctx context.Context, device *models.Device, record *apptypes.Codec8AvlRecord) {
	for i, avl := range record.Content.AVL_Datas {
		telemetry := apptypes.FlatAvlRecord{
			Timestamp:  avl.Timestamp,
			Priority:   avl.Priority,
			Longitude:  avl.GPSelement.Longitude,
			Latitude:   avl.GPSelement.Latitude,
			Altitude:   avl.GPSelement.Altitude,
			Angle:      avl.GPSelement.Angle,
			Satellites: avl.GPSelement.Satellites,
			Speed:      avl.GPSelement.Speed,
			Elements:   avl.IOelement.Elements,
		}

		rec := map[string]any{
			"device_id":       device.ID,
			"asset_id":        device.AssetID,
			"organisation_id": device.OrganisationID,
			"happened_at":     avl.HappenedAt,
			"protocol":        device.Protocol,
			"vendor":          device.Vendor,
			"telemetry":       telemetry,
		}

		msg, err := json.Marshal(rec)
		if err != nil {
			logger.Warn("replay: failed to marshal telemetry payload", zap.Error(err))
			continue
		}

		p.App.MQProducer.SendDirectMessage("teltonika_telemetry", "teltonika", string(msg))

		// First record is the most recent in the packet.
		if i != 0 {
			continue
		}

		incomingTs, err := time.Parse(time.RFC3339, avl.HappenedAt)
		if err != nil {
			logger.Warn("replay: invalid telemetry timestamp; skipping comparison",
				zap.String("device_external_id", device.ExternalID),
				zap.String("income_ts", avl.HappenedAt),
				zap.Error(err),
			)
			continue
		}

		// Read-check-write under LastTsLock — concurrent device goroutines may
		// reach this point, so the whole sequence must be atomic.
		p.App.LastTsLock.Lock()
		lastTs, ok := p.App.LastTsMap[device.ID]
		shouldUpdate := !ok || incomingTs.After(lastTs)
		if shouldUpdate {
			p.App.LastTsMap[device.ID] = incomingTs
		}
		p.App.LastTsLock.Unlock()

		if !shouldUpdate {
			continue
		}

		p.Service.UpdateLastTelemetry(device.ID, telemetry)

		// Publish to the live channel; respect shutdown to avoid blocking.
		select {
		case p.App.PubCh <- cache.PubMsg{Channel: "teltonika:live", Payload: msg}:
		case <-ctx.Done():
			return
		}
	}
}
