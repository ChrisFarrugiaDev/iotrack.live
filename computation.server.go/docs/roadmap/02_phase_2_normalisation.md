# Phase 2 — Normalisation (COMPLETE)

Archived verbatim from ROADMAP.md on 2026-07-19. Completed 2026-07-18.
Includes the live-DB ground-truth survey the normaliser is built on.

## Phase 2 — Normalisation (§38 Phase 2, §10–§11)

Deliverable: the report pipeline hands the engine (and, for now, the
response) `[]report.TelemetryPoint` — the §10 internal shape — instead of raw
DB rows. Acceptance (§38): nothing downstream of the normaliser depends on
raw DB column names; invalid points are identified (marked, not dropped —
dropping is the engine's §13 decision); null values stay distinct from false.

### Ground truth — live-DB survey (2026-07-16, 3000 recent rows; NOTE: that DB is PRODUCTION)

Facts the steps below are built on; re-verify with `compute-dev-check`'s
`dbquery.sh` if the parser changes:

- Payload keys: `latitude`, `longitude`, `altitude`, `angle`, `speed`,
  `satellites`, `priority`, `timestamp` (epoch **string**), `elements`.
- Only vendor today: `teltonika` (protocol `4G`, model NULL). The vendor
  mapper is a seam, not a dispatch problem yet.
- Elements present in every row: `1` (digital_input_1), `239` (ignition),
  `240` (movement), `16` (total_odometer), `66`/`67` (voltages), `21`
  (gsm_signal), `200` (sleep_mode), `80` (data_mode), `69`, `68`, `12`;
  most rows also `78` (ibutton), `181`/`182` (pdop/hdop), `241`, `248`.
- Encodings that must not be guessed wrong:
  - `239`/`240` are JSON **numbers 0/1**, never booleans;
  - `78` is number `0` when no tag is present, and a quoted **string** when
    a real 18-digit tag is (the parser's NormalizeIDs guarantees this);
  - the payload `timestamp` is an epoch string — but `happened_at` is the
    authoritative, already-parsed UTC time; the payload copy is ignored.
- `pto` / `engine_running` (§11's first two priorities) do not exist in
  current data — activity resolution will fall through to ignition today.
  Keep the branches anyway; they are the contract with future tracker
  configs.
- A second survey across the table's full span (Sep 2025 → Jul 2026,
  924k rows) added:
  - the **oldest** 3000 rows are not uniform: `239` (ignition) is present
    in only ~78% and `1`/`78` in ~60% — the nil paths (`IgnitionOn == nil`)
    are real data, not defensive theory;
  - ids absent from recent rows appear historically (`11`, `14`, `206`) —
    the unknown-id passthrough is exercised by real rows;
  - 64% of all telemetry has `NULL asset_id` (unassigned devices) and can
    never reach a report (§29) — report-scale numbers are the asset-scoped
    ~328k rows, all `vehicle` type; no personal-tracker payloads exist yet.

### Step 0 — Shape decisions (docs only, before code)

- [x] Pin the `TelemetryPoint` struct in `SPEC.md` (§10 fields, Go types):
      pointers for every §41.4 null-able signal (`IgnitionOn`, `ActivityOn`,
      `MovementDetected` as `*bool`), `GPSValid bool`, `Parameters
      map[string]any` keyed by parser names. JSON tags camelCase to match
      the §18 `ReportPoint` contract (`speedKph`, `ignitionOn`, …) so the
      frontend's point shape is satisfied by the same struct; the extra
      fields (`movementDetected`, `gpsValid`) are additive and harmless.
- [x] Decide and record the invalid-coordinate rule: latitude/longitude
      outside ±90/±180, or the 0,0 fix, marks `GPSValid=false`. Points are
      kept — §38 says identified, §13's filtering belongs to the engine.
- [x] Record the response change: Phase 1 returned raw rows; Phase 2 returns
      normalised points. `rawPointCount` keeps meaning rows fetched.
- Verify: SPEC section reads coherently against §10/§18; no code yet.

### Step 1 — report package bootstrap

- [x] `internal/report/report.go` — package doc stating the purity rule (no
      HTTP, no SQL, no logger — models in, points out) plus the
      `TelemetryPoint` and `ActivitySource` types from Step 0.
- [x] The package imports `internal/models` only (structs) — nothing else
      internal. Purity is what lets §36.2 fixtures test it directly.
- Verify: builds; `go vet` clean; no forbidden imports (spot-check).

### Step 2 — IO element naming

- [x] `internal/report/ioelements.go` — the id→name subset this service
      reads, copied verbatim from
      `teltonika.parser.go/internal/teltonika/IoElementsMap.go` naming
      (1 digital_input_1, 21 gsm_signal, 16 total_odometer, 66
      external_voltage, 67 battery_voltage, 69 gnss_status, 78 ibutton,
      80 data_mode, 181 gnss_pdop, 182 gnss_hdop, 200 sleep_mode, 207 rfid,
      239 ignition, 240 movement, 241 active_gsm_operator). Two services
      disagreeing on a name is a §-level contract bug.
- [x] Unknown ids pass through under their numeric key — never dropped,
      never renamed by guesswork.
- Verify: unit test — known id maps, unknown id survives.

### Step 3 — the normaliser

- [x] `internal/report/normalise.go` — `Normalize([]models.Telemetry)
      ([]TelemetryPoint, NormalizeStats)`:
      - `Timestamp` from `happened_at` (already UTC); payload epoch ignored;
      - `latitude`/`longitude`/`altitude`/`speed` → floats; `angle` →
        `Heading` (course source is the engine's business later — §41
        prefers course-over-ground computed from fixes, not this field);
      - `239`/`240` numbers → `*bool` (`0`→false, `1`→true, absent→nil —
        null is never collapsed to false);
      - `ActivityOn` from `digital_input_1` as a provisional work-input
        signal (absent→nil), documented as the per-asset-config seam;
      - ibutton/rfid: number `0` or empty → absent; anything else kept as a
        **string** end to end (the 2^53 rule — a real tag serialised as a
        JSON number corrupts in every browser);
      - `Parameters` carries the named elements; values otherwise unaltered;
      - invalid coordinates → `GPSValid=false`, point kept.
- [x] `NormalizeStats{Raw, Accepted, InvalidGPS int}` — the §37 counters;
      "accepted" = raw for now (nothing is dropped), the split exists so the
      engine's later filtering has somewhere to report.
- [x] `internal/report/activity.go` — `ResolveActivity(TelemetryPoint)
      (active *bool, source ActivitySource)` in §11's priority order
      (pto → engine_running → ignition → device activity → unknown).
      Per-point and pure, so it lands here rather than Phase 3.
- Verify: builds; the Step 4 tests are the real check.

### Step 4 — unit tests on real payloads

- [x] Fixtures from reality, not invention: 2–3 payloads sampled from the
      live DB via `dbquery.sh` (read-only) plus the known awkward one (the 18-digit
      ibutton string sample) as Go table-test cases.
- [x] The table pins every acceptance rule: absent `239` → `IgnitionOn ==
      nil` (not false); `0`/`1` → false/true; ibutton number-0 → absent;
      ibutton string → still a string after marshal (quoted in JSON);
      invalid/0,0 coords → `GPSValid=false` but point present; unknown
      element id preserved under numeric key; `Timestamp` equals
      `happened_at`, not the payload epoch.
- [x] `ResolveActivity` table: each §11 priority level, including the
      all-nil → `unknown` fallthrough.
- Verify: `go test ./internal/report` — no DB, no flags, runs anywhere.

### Step 5 — wire into the service

- [x] `report_service.go`: after the fetch, `report.Normalize(rows)`;
      `ActivityReportResult.Points` becomes `[]report.TelemetryPoint`;
      `RawPointCount` unchanged in meaning.
- [x] Handler log line gains `accepted_point_count` and `invalid_gps_count`
      (§37 raw/accepted/rejected).
- [x] Service integration test (RUN_DB_TESTS=1) asserts the normalised
      shape on real data: points carry camelCase JSON, `ignitionOn` is
      true/false/null (never 0/1), any ibutton in `parameters` is a JSON
      string.
- Verify: full suite; `RUN_DB_TESTS=1` suites against the live DB
  (read-only).

### Step 6 — Phase 2 acceptance

- [x] devserver smoke: a served response shows normalised camelCase points;
      spot-check one row against its raw payload in the DB (same fix, 0/1
      became booleans, ibutton quoted).
- [x] §38 criteria walked: no raw column names downstream of the
      normaliser; invalid points identified; null distinct from false.
- [x] `go build ./...`, `go vet ./...`, full test suite clean.
- Verify: matrix recorded here, boxes ticked, Current State updated.
