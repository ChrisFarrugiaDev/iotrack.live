# Activity Report — Placeholder Frontend Roadmap

Frontend-only, non-functional first pass at the Activity Report described in
`docs/iotrack_activity_report_design.md` (section references below, e.g. §24,
point at that document). The page is built against **mocked data** so the UI,
map and table could be designed and reviewed before the backend segmentation
engine exists.

**There is no backend. Every report on this page is fabricated.**

Branch: `feat/activity-report-ui` — not merged; `main` does not have any of this.

Commits:

```
75b0ecb fix(frontend): don't scroll the table while scrubbing the report slider
0c78213 feat(frontend): use a red pin arrow on the report map for contrast with routes
9015794 feat(frontend): match report point marker to the live map vehicle arrow
fd60977 feat(frontend): add timeline mode and polish the Activity Report
a2f186c feat(frontend): add Activity Report map, table and summary; fix date picker timezone
646bce8 feat(frontend): scaffold Activity Report placeholder UI with mock data
```

## Guardrails

The four rules this work was started under. Three held; one was overridden.

1. ✅ **Use the API contract verbatim.** Types come from §18 and §19.3
   (`ActivityReportResponse`, the segment union, `distanceMeters` / `speedKph`
   units). The mock satisfies the contract — it does not invent one.
2. ✅ **One swap seam.** A single store action returns the fixture today and
   calls `POST /api/reports/activity` later. No component knows the data is fake.
3. ✅ **Make the fixture ugly on purpose.** A clean three-journey day produces a
   UI that looks great and breaks on real data. The awkward cases (§36.2) are all
   in the fixture.
4. ❌ **"Do not light up the sidebar."** — **OVERRIDDEN.** The Reports sidebar
   item was wired up during development, so the fake report is now reachable by
   every user with no permission check. See the security debt item below.

## Existing pieces reused

- Map: `vue3-google-map`. Marker shape/colour copied from
  `src/components/map/MarkerVehicle.vue`.
- Date range: `v-calendar` (registered globally in `main.ts`).
- Layout/primitives: `Vview` from `@/ui`.
- Selects: `vue3-select-component` + `useVueSelectStyles`.
- Sidebar flyout: same pattern as `TheUserMenu.vue` / `dashboardStore`.
- Asset list: `assetStore.getAssets`.

---

## Steps

### Phase A — Contract and mock data ✅

- [x] Report types in `src/types/activity-report.type.ts`.
  - Transcribed from §18 / §19.3. Segments are a discriminated union on `type`.
  - Includes `TimelineObservation` and the §43 `SegmentBoundary` flags.

- [x] Fixture at `src/mock/activity-report.mock.ts`.
  - §36.2 **Scenario C (cherry picker)**, 06:00–18:00: journey → active_static
    (PTO, 2h27m) → journey → stationary → journey → **data gap (30m)** → journey
    → stationary.
  - Deliberately awkward: a journey **already under way** when the window opens,
    a **traffic-light stop inside** journey 1 that must not split it (§14.2), and
    a stationary period **still running** at the window's close (both §43).
  - **Adjustment:** points are *generated* along waypoints rather than
    hand-typed, so the map gets a real polyline and `pointCount` always equals
    `points.length`.
  - **Adjustment:** the summary is produced by a `deriveSummary()` function, not
    typed by hand — §23 requires the summary to come from the segments. The
    durations reconcile exactly to the 12-hour window.
  - Also exports `mockEmptyActivityReport` for the empty state.

- [x] `src/stores/activityReportStore.ts` with the **swap seam**.
  - `fetchActivityReport()` contains one marked `--- mock ---` block and a TODO
    with the exact axios call that replaces it.
  - Owns `selectedSegmentId` and `selectedPoint`; getters for summary, subject,
    chronological segments/observations, and the flat point track.

### Phase B — Route and page shell ✅

- [x] Route `/reports/activity` → `reports.activity` →
  `src/views/reports/ActivityReportView.vue`.
  - **Still no `routePermissions` entry** — `report.view` does not exist.
- [x] Page shell using `Vview`, §6 layout: filters → summary → map → slider →
  table.
- [x] **Added (not in the original plan):** the **Reports sidebar item now opens
  a flyout** (`src/components/dashboard/TheReportsMenu.vue`) listing "Activity
  Report", reusing the Menu / `TheUserMenu` pattern. `dashboardStore` gained
  `isReportsMenuOpen`; only one flyout is open at a time and the sidebar widens
  for it. **This is what broke guardrail 4.**

### Phase C — Filter form ✅

- [x] `src/components/reports/ReportFilters.vue` — §7 v1 fields only: asset,
  from, to, Generate. Organisation is **not** a field (it comes from the JWT).
- [x] Validation (convenience only; the backend stays authoritative): asset
  required, start before end, and the **7-day vehicle limit** from §30.
- [x] Loading / empty-report / error / nothing-generated-yet states in the view.
- **Adjustment:** the asset picker uses `assetStore.getAssets` directly, *not*
  `getAssetsWithDevice` — that getter applies the live map's org/type filters
  from `filterStore` and would silently hide assets.
- **Fixed:** the date pickers originally took a hardcoded `Europe/Malta`
  timezone while defaulting to *local* midnight, so "From" showed 01:00. They
  now work in local time and convert to UTC on submit (§21).
- **Fixed:** the asset dropdown menu was **clipped** by `Vview`'s scrolling body.
  Solved with `teleport=".dashboard"` — see Gotchas.

### Phase D — Summary cards ✅

- [x] `ReportSummary.vue` — the six §19.3 figures: journeys, distance, moving,
  Active Stationary, stationary, data gap. Colour-coded left borders establish
  the segment colour language reused by the table, map and slider.
- [x] Formatters in `src/utils/report.utils.ts` (`formatDuration`,
  `formatDistance`, `formatSpeed`, `formatTime`, `formatDateTime`,
  `formatCoords`, and later `bearingBetween`). Units stay raw in the data (§22).
- **Added:** a subject line above the cards (asset name + window + timezone).
- **Added later:** the cards switch to Sightings / First seen / Last seen /
  Straight-line distance in timeline mode — "Moving: 0m" would be misleading.

### Phase E — Segment table ✅

- [x] `ReportTable.vue` — chronological, grouped by segment (§26). A purpose-built
  table, **not `VTable`**: the rows need per-type rendering that a generic
  column-definition table can't express honestly.
- [x] **Context-aware cells** — distance renders only for journeys; everything
  else shows `—`, never `0 km`. Details adapt per type (max speed / `Working —
  PTO` / `Parked` / `No data — route unknown`).
- [x] "Active Stationary" as the UI label for `active_static` (§8.2).
- [x] Partial segments marked with `…` on the clipped edge (§43).
- [x] Row selection → `selectedSegmentId` (drives the map).
- [x] Expandable rows showing the §27 detail points.
- **Adjustment:** the **Heading column was removed.** The device's heading field
  depends on how the tracker was mounted and is usually wrong — see Invariant 4.

### Phase F — Map ✅

- [x] `ReportMap.vue` on `vue3-google-map`, per §24:
  - journey → **solid** polyline + start/end markers;
  - active_static → amber marker, tooltip carries duration **and activity source**;
  - stationary → grey parked marker;
  - **data_gap → dashed connector, never a solid route** (§8.4).
- [x] Fits bounds to the report's own points; clamps zoom at 17 so a single
  stationary fix doesn't slam to street level.
- [x] Two-way selection sync: table row ↔ map feature.
- **Added:** `gestureHandling: "cooperative"` — wheel scrolls the page, ctrl+wheel
  zooms. (The live map deliberately still captures the wheel.)
- **Added:** clicking a **telemetry row pins the vehicle** at that point — an
  arrow rotated to its **course over ground**, with a details card in the map's
  bottom-left corner. Click the same row again to unpin.
- **Removed:** the map legend. Its corner slot now holds the point-details card.
  See the open item below — this lost the "route unknown" wording.

### Phase G — Review pass ✅ (reviewed in the browser by the owner)

- [x] `npm run build` (runs `vue-tsc`) — clean.
- [x] Walked with the ugly fixture; the gap, PTO period, short stop and partial
  segments all render honestly.
- [x] Reviewed and iterated on layout, marker style, slider and scroll behaviour.

---

## Beyond the original plan

These were **out of scope** in the first draft and were built anyway, at the
owner's request:

### Timeline mode for sparse asset trackers ✅ (was Phase 8 / deferred)

- [x] `ReportTimeline.vue` — a table of **sightings**, not journeys: Seen at,
  Position, Moved / Same place, Distance from previous, Battery. There is no
  duration, speed or route, because none of that is knowable (§3.3, §41.5).
  The distance column is footnoted as **straight-line**, not distance travelled.
- [x] Map draws sighting markers joined by a **dashed** connector.
- [x] The mock picks the mode from the selected asset's `asset_type`,
  approximating the `auto` rule (§4.3): `asset` → timeline, otherwise journey.
  So **to see timeline mode you must pick an "Equipment / Asset" asset.**
- Rationale: it retires the riskiest line in the contract —
  `segments: ActivitySegment[] | TimelineObservation[]` — by exercising the union
  end to end, so the backend can't ship a shape the frontend won't render.

### Timeline slider ✅ (was Phase 6 / deferred, §25)

- [x] `ReportSlider.vue` — scrubs the flat point track (`store.scrubTo(index)`).
  Moving it pins the point on the map, pans there, highlights the segment, and
  highlights the table row.
- [x] The track is **colour-coded by segment and laid out proportionally in
  time**, so the shape of the day is visible before you touch it. The **data gap
  occupies real width** even though it contains no points — the day didn't pause.
- [x] ‹ › buttons step point by point; the range input is arrow-key navigable.
- **No autoplay** — deliberate (§41.2). It would build on `scrubTo(index)`.

---

## ⚠️ Security debt — before this ships

- [ ] **Gate `report.view`.** The Reports sidebar item is visible to **every
      user** and opens a report built from **fabricated telemetry**.
      1. Seed the key in `initdb-scripts/05-tables.sql` with deliberate role
         defaults.
      2. Add `'reports.activity': 'report.view'` to the `routePermissions` map in
         `src/router/index.ts`.
      3. Gate the sidebar item with `authorizationStore.can('report.view')`.
      4. Backend: `requirePermissions(["report.view"])` on the route.
      See design doc §20 and `ROADMAP.md`.

## Next

- [ ] **Backend Phase 1** (§38): route, Zod validation, auth, org/asset access
      checks, telemetry query by `asset_id` (**never** by the asset's current
      `device_id` — §45). No segmentation engine yet.
- [ ] **Swap the seam** in `activityReportStore.fetchActivityReport()`.
- [ ] **Promote the fixture** into the backend's segmentation unit tests — it was
      built to cover the §36.2 scenarios for exactly this purpose.

## Smaller open items

- [ ] The map **has no legend** any more. Nothing explains that the red dashed
      line means "route unknown", which is the report's most important honesty
      property. Consider restoring it only while no point is pinned.
- [ ] Apply `teleport=".dashboard"` to the **user form** selects too — the same
      clipping bug probably explains the empty-looking "Add assets by group" menu
      (see `USER_FORM_UI_ROADMAP.md`).
- [ ] Timezone: "midnight" is currently the *browser's*. If an org's timezone
      differs from the viewer's, that's ambiguous. A product decision (§42 Q14).

---

## Invariants — do not "fix" these

These encode design-doc rules. They look like quirks. They are not.

1. **A data gap is never drawn as a solid route.** Dashed connector only; the
   route through a gap is unknown (§8.4). Same for connectors between timeline
   sightings (§41.5).
2. **`null` is not `false`.** Unknown ignition/activity renders `—`, never
   "Off" (§41.4).
3. **Timeline mode has no durations, speeds or routes.** `TimelineObservation`
   deliberately lacks those fields — they aren't knowable for a tracker that
   reports every few hours. Don't add them (§3.3, §48).
4. **The map arrow uses course over ground**, computed from consecutive fixes
   (`bearingBetween`), *not* the device's `heading` field — that reflects how the
   tracker was mounted and is usually wrong. The live map's `MarkerVehicle.vue`
   does the same. A fix with no direction (stationary, or a lone point) draws a
   **circle**, not an arrow pointing north.
5. **Context-aware table cells.** A stationary row has no distance; it shows
   `—`, not `0 km` (§26).
6. **The summary is derived from the segments**, never computed separately (§23).
7. **Partial segments** (clipped by the report window) are marked `…` (§43).
8. **Units stay raw** — metres and km/h in the data; only the UI formats (§22).

## Gotchas discovered the hard way

- **`SymbolPath.FORWARD_CLOSED_ARROW` is not north-up.** It's oriented for
  polylines, so rotating it by a compass bearing points it **backwards**.
  `ReportMap` uses its own arrow path (copied from `MarkerVehicle.vue`,
  recentred on the origin) where `rotation: course` means what it says.
- **`Vview`'s body scrolls (`overflow-y: auto`), which clips dropdown menus.**
  Fixed with `teleport=".dashboard"` on the `VueSelect` — note **not** `body`:
  the design tokens (`--color-*`, `--vs-*`) and `data-theme` live on
  `<main class="dashboard v-ui">`, so teleporting outside it strips all styling.
- **Scrubbing must not scroll the page.** The table scrolls the selected row into
  view when the segment changes, but skips it while a point is pinned — otherwise
  dragging the slider yanks the page down to the table.
- **The map must not refit bounds while scrubbing**, or it lurches every time the
  track crosses a segment boundary. The point watcher pans instead.
- The pinned arrow is **red** (`#dc2626`), not the live map's blue: the report
  draws journeys in blue and the arrow would vanish into the route.

## Verifying

```sh
cd web.frontend.vue && npm run build   # runs vue-tsc
```

Then deploy (`make sync` from the repo root; the Go server serves `dist/` from
disk, so no rebuild or restart is needed) and open **Reports → Activity Report**.
Pick any asset — the mock ignores which, except that `asset_type` chooses the
mode — and Generate.

The fixture is deliberately awkward and should render honestly: a journey already
under way at the window's start (`…`), a traffic-light stop that does *not* split
that journey, 2h27m of PTO work, a 30-minute data gap shown as **dashed**, and a
stationary period still running at the end. If any of those render dishonestly,
that's a bug.
