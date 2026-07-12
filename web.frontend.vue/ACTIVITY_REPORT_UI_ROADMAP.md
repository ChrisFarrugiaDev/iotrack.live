# Activity Report — Placeholder Frontend Roadmap

Frontend-only, non-functional first pass at the Activity Report described in
`docs/iotrack_activity_report_design.md`. The page is built against **mocked
data** so the UI, map and table can be designed and reviewed before the backend
segmentation engine exists.

No backend work is in scope here. Nothing in this roadmap calls a real API.

## Guardrails

Four rules that decide whether this saves time or creates rework:

1. **Use the API contract verbatim.** Types come from §18 and §19.3 of the design
   doc (`ActivityReportResponse`, the segment union, `distanceMeters` /
   `speedKph` units). The mock satisfies the contract — it does not invent one.
2. **One swap seam.** A single store action returns the fixture today and calls
   `POST /api/reports/activity` later. No component knows the data is fake.
3. **Make the fixture ugly on purpose.** A clean three-journey day produces a UI
   that looks great and breaks on real data. Cover the awkward cases (§36.2).
4. **Do not light up the sidebar.** `report.view` is not seeded and the Reports
   item is still a dead placeholder. Reach the page by URL until the permission
   exists — never ship a fake report that looks real.

## Existing pieces to reuse

- Map: `vue3-google-map`; `src/components/map/TheMap.vue` (live tracking — the
  report map needs polylines/markers, so reuse patterns, not the component).
- Date range: `v-calendar` is already a dependency.
- Layout/primitives: `Vview`, `VTabs`, `VTable`, `VSearch` from `@/ui`.
- Asset picker: `assetStore` / the tree-select patterns used in the user form.
- Route guards: the `routePermissions` map in `src/router/index.ts`.

---

## Steps

### Phase A — Contract and mock data

- [x] Add report types in `src/types/activity-report.type.ts`.
  - Transcribe from design doc §18 and §19.3: `ActivityReportResponse`,
    `ReportPoint`, `ReportLocation`, `JourneySegment`, `ActiveStaticSegment`,
    `StationarySegment`, `DataGapSegment`, `TimelineObservation`.
  - Segments are a discriminated union on `type`.

- [x] Add a fixture at `src/mock/activity-report.mock.ts` satisfying those types.
  - Base it on §36.2 **Scenario C (cherry picker)**: journey → active_static
    (PTO) → journey → stationary.
  - Also include: a **data gap**, a **short stop inside a journey**, and a
    segment that is **partial at the report boundary** (§43).
  - Use realistic Malta coordinates (~35.8–35.9, ~14.4–14.5) so the map frames
    correctly.
  - Keep it exportable as plain data — it should later double as a backend unit
    test fixture (§36.2).

- [x] Create `src/stores/activityReportStore.ts` with the **swap seam**.
  - State: `report`, `loading`, `error`.
  - Action `fetchActivityReport(assetId, from, to)` — returns the fixture after
    a small artificial delay; a `// TODO: replace with POST /api/reports/activity`
    comment marks the one line that changes later.
  - Getters for the summary and for segments grouped/sorted chronologically.

### Phase B — Route and page shell

- [x] Add the route in `src/router/index.ts`: `/reports/activity` →
  `reports.activity`, rendering a new `views/reports/ActivityReportView.vue`.
  - No `routePermissions` entry yet (no `report.view` key exists).

- [x] Build the page shell in `views/reports/ActivityReportView.vue` using
  `Vview`, following the §6 vertical layout:
  filters → summary cards → map → table.

- [x] Open the report from the sidebar.
  - The Reports item now opens a flyout (`TheReportsMenu.vue`), reusing the
    Menu / `TheUserMenu` pattern; `dashboardStore` tracks `isReportsMenuOpen`
    and only one flyout is open at a time.
  - Note: the item is visible to everyone until `report.view` is seeded and
    gated — close this off before the report ships.

### Phase C — Filter form

- [ ] Build the filter row (§7 version 1 fields only).
  - Asset picker (single select, from the existing asset store).
  - Start and end date/time (`v-calendar`).
  - "Generate Report" button.
  - Organisation is **not** a field — it comes from the JWT context (§7).
- [ ] Wire the button to `activityReportStore.fetchActivityReport(...)`.
- [ ] Handle the three UI states: loading, empty report, error.

### Phase D — Summary cards

- [ ] Render the §19.3 `summary` block as cards: journey count, total distance,
  moving time, active-stationary time, stationary time, communication gap.
- [ ] Format units in the UI only — metres and km/h stay raw in the data (§22).

### Phase E — Segment table

- [ ] Build the grouped activity table (§26), chronological by segment.
  - Columns: Type, Start, End, Duration, Distance, Details.
  - **Context-aware cells** — do not force irrelevant values (a stationary row
    has no distance or max speed; show `—`).
  - Use the UI label **"Active Stationary"** for `active_static` (§8.2).
- [ ] Row selection state (drives map highlighting in Phase F).
- [ ] Expandable journey rows showing detailed points (§27) — coordinates,
  speed, ignition, activity. Keep the raw parameter dump out by default.

### Phase F — Map

- [ ] Build `components/reports/ReportMap.vue` on `vue3-google-map`.
- [ ] Render per segment type (§24):
  - journey → solid polyline + start/end markers;
  - active_static → distinct work/activity marker with duration;
  - stationary → parked marker;
  - **data_gap → dotted connector, never a solid route** (§8.4 — the route
    through a gap is unknown and must not be implied).
- [ ] Fit bounds to the report's points on load.
- [ ] Sync selection: selecting a table row highlights its map segment.

### Phase G — Review pass

- [ ] `npm run build`.
- [ ] Walk the page with the ugly fixture and confirm the gap, the active
    stationary period, the short stop and the partial boundary segment all
    render honestly.
- [ ] Screenshot/review the layout before any backend work starts — that is the
    point of this whole exercise.

---

## Deliberately out of scope

- Any backend, API route, permission seeding, or `report.view` gating.
- Timeline slider (§25) — depends on stable segments (§41.2).
- Groups, multiple assets, exports, scheduled reports, reverse geocoding.
- Personal-tracker and asset-tracker (timeline mode) behaviour — vehicle only.

## When the backend lands

- Replace the one marked line in `activityReportStore`.
- Seed `report.view`, gate the route in `routePermissions`, and enable the
  Reports sidebar item (see `ROADMAP.md` item 4 and design doc §20).
- Promote the mock fixture into the backend's segmentation unit tests.

## Caveat

This inverts the design doc's build order (§47: backend → table → map). That is
a deliberate trade to de-risk the UI early. It does mean the thresholds in §40
stay untuned until the real engine exists — so do not let the mock's tidy
segment boundaries set an expectation that real cherry-picker data will look
this clean.
