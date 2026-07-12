# iotrack.live Activity / Journey Report
## Product, Architecture, Data Processing, API, UI, and Implementation Plan

**Project:** iotrack.live  
**Primary services involved:**
- `web.frontend.vue`
- `web.backend.node.ts.api`
- Future candidate: `web.backend.go`
- Existing telemetry ingestion and database writer services

**Document purpose:**  
This document gives an implementation agent a complete overview of the proposed report feature, explains the reasoning behind the design, defines the report behaviour in depth, and provides a staged implementation plan.

---

# 1. Executive Overview

The first reporting feature in iotrack.live should not be several separate reports with overlapping logic.

Instead of building:

- Journey Report
- Detailed Report
- Waypoint Report
- Parameter Report

as independent features immediately, the first goal should be to build one strong and flexible report that answers the main operational question:

> What happened to this tracked asset during the selected period?

The recommended working name is:

## **Activity Report**

The Activity Report combines:

- journey information;
- detailed telemetry;
- stationary periods;
- active-but-not-moving periods;
- sparse location history;
- map visualisation;
- chronological playback;
- grouped table data.

The same report page should support the three main tracker behaviours currently used by iotrack.live:

1. Vehicle trackers
2. Personal trackers
3. Asset trackers

The report must not force all three tracker types into the same journey logic.

Vehicle and personal trackers can often be interpreted as journeys. Sparse asset trackers should normally be shown as position history rather than as precise journeys.

---

# 2. Main Product Decision

## 2.1 One strong report first

The initial implementation should prioritise one high-quality report rather than several limited reports.

Advantages:

- shared date-range filtering;
- shared asset and group selection;
- shared organisation and permission handling;
- one map implementation;
- one timeline implementation;
- one table framework;
- less duplicated backend logic;
- easier future migration of heavy processing to Go;
- faster feedback from real users.

The first version should be useful even before export, scheduled reports, or multiple report templates are added.

---

# 3. Tracker Categories

## 3.1 Vehicle tracker

Typical behaviour:

- attached to a vehicle or machine;
- reports approximately every 10 seconds while moving or active;
- may provide:
  - GPS speed;
  - ignition state;
  - engine state;
  - PTO state;
  - digital inputs;
  - odometer;
  - movement flag;
  - other Teltonika parameters.

This tracker type supports the richest report.

The report should identify:

- journeys;
- short stops inside journeys;
- parked periods;
- active-but-stationary periods;
- communication gaps.

A vehicle may be stationary while still performing useful work.

Examples:

- cherry picker;
- crane;
- pump vehicle;
- utility vehicle;
- generator vehicle;
- maintenance van;
- refrigerated vehicle;
- construction machinery.

For these cases, stationary time must not automatically be treated as inactivity.

---

## 3.2 Personal tracker

Typical behaviour:

- worn or carried by a person;
- sends data less frequently than a vehicle tracker;
- may lack ignition and PTO signals;
- movement is inferred mainly from:
  - GPS changes;
  - speed;
  - accelerometer or movement flags;
  - elapsed time;
  - distance between points.

The report may divide activity into movement periods or journeys, but the algorithm must use looser timing rules than vehicle tracking.

The report should normally use:

- journey;
- stationary;
- data gap.

`active_static` may not be meaningful unless the device has a reliable activity input.

---

## 3.3 Asset tracker

Typical behaviour:

- attached to a non-powered or low-activity asset;
- reports every few hours;
- may report once or several times per day;
- may report at a configured time;
- may wake after movement or tampering.

Examples:

- trailer;
- container;
- equipment;
- portable machinery;
- static asset;
- pallet or cargo unit.

Sparse points must not be presented as a precise route.

For example:

```text
08:00 — Valletta
14:00 — Mosta
20:00 — Gozo
```

The system knows that the position changed, but it does not know:

- the exact departure time;
- the exact arrival time;
- the route taken;
- the stops made;
- the real journey duration.

For asset trackers, the default report behaviour should therefore be a chronological position timeline.

---

# 4. Report Modes

A report mode defines how raw telemetry is interpreted and presented.

## 4.1 `journey`

The backend groups telemetry into operational segments such as:

- journey;
- active static;
- stationary;
- data gap.

Best suited to:

- vehicle trackers;
- sufficiently frequent personal trackers.

---

## 4.2 `timeline`

The backend returns chronological observations without pretending that exact journeys are known.

Best suited to:

- sparse asset trackers;
- debugging;
- low-frequency devices;
- raw position history.

---

## 4.3 `auto`

The system chooses the most suitable behaviour.

Recommended default:

| Tracker category | Selected behaviour |
|---|---|
| Vehicle | Journey |
| Personal | Journey when point frequency is sufficient |
| Asset | Timeline |

`auto` may initially be internal and hidden from the UI.

The first implementation can automatically choose the behaviour based on asset or tracker configuration.

---

# 5. Recommended Scope for Version 1

Version 1 should be intentionally limited.

## Include

- current organisation context;
- one selected asset;
- date and time range;
- vehicle tracker support first;
- journey segmentation;
- active-static segmentation;
- stationary segmentation;
- data-gap handling;
- summary totals;
- grouped table;
- map;
- permission enforcement.

## Defer

- groups as a report input;
- multiple assets in one report;
- personal tracker tuning;
- asset tracker timeline mode;
- playback animation;
- scheduled reports;
- email delivery;
- PDF export;
- Excel export;
- reverse-geocoded addresses;
- report templates;
- custom parameters;
- cross-organisation reports.

This keeps the first release achievable while preserving the full architecture.

---

# 6. User Interface

The Activity Report page should contain four main areas:

1. Filter form
2. Summary
3. Map
4. Grouped table
5. Timeline slider later

A practical layout is:

```text
---------------------------------------------------------
Report Filters
---------------------------------------------------------
Summary Cards
---------------------------------------------------------
Map
---------------------------------------------------------
Timeline / Slider
---------------------------------------------------------
Grouped Activity Table
---------------------------------------------------------
```

On wide screens, the map and table may share horizontal space, but a vertical layout is easier for the first version.

---

# 7. Filter Form

## Version 1 fields

- Asset
- Start date and time
- End date and time
- Generate Report button

The organisation is taken from the active JWT organisation context and must not be selected directly on the report page.

## Later fields

- Group
- Multiple assets
- Report mode
- Include raw points
- Segment filters
- Minimum stop duration
- Parameter selection
- Export type
- Time zone
- Speed unit
- Distance unit

## Validation

The backend must validate:

- asset belongs to the active organisation;
- user is allowed to access the asset;
- start is before end;
- range is not larger than the configured maximum;
- requested dates are valid;
- device has telemetry;
- report type is supported.

The frontend validation is for convenience only. The backend remains authoritative.

---

# 8. Core Activity States

The vehicle report should initially support four states.

```ts
type ActivityState =
    | 'journey'
    | 'active_static'
    | 'stationary'
    | 'data_gap';
```

---

## 8.1 Journey

The vehicle is moving.

Typical fields:

- start time;
- end time;
- duration;
- distance;
- average speed;
- maximum speed;
- start coordinates;
- end coordinates;
- number of points;
- detailed points;
- end reason.

---

## 8.2 Active Static

The vehicle is not moving, but the vehicle or equipment is still active.

Possible activity sources:

- ignition;
- PTO;
- engine-running parameter;
- digital input;
- configured device parameter;
- application-specific activity flag.

This is an important operational state.

Example:

```text
09:15–11:47
Active but stationary
Duration: 2h 32m
PTO active
```

For a cherry picker, this may represent productive work rather than idling.

### Recommended naming review

Internally, `active_static` is clear for code.

In the UI, use a more user-friendly label such as:

- **Active Stationary**
- **Working Stationary**
- **Active While Stopped**

Recommended UI label:

## **Active Stationary**

It is understandable and remains neutral across vehicle types.

---

## 8.3 Stationary

The tracker is not moving and there is no reliable activity signal.

For a vehicle, this normally represents:

- parked;
- inactive;
- stopped after a journey.

Short pauses such as traffic lights should remain inside a journey and should not create a separate stationary segment.

---

## 8.4 Data Gap

A data gap means the elapsed time between consecutive points is too large to safely infer continuous activity.

The system must not assume:

- the vehicle stayed still;
- the vehicle travelled directly between the points;
- the ignition state remained unchanged;
- the route is known.

On the map:

- do not draw a normal solid route through the gap;
- optionally draw a dotted line;
- show a clear data-gap indicator.

---

# 9. Recommended Additional Internal State

A future improvement is an `unknown` state.

```ts
type ActivityState =
    | 'journey'
    | 'active_static'
    | 'stationary'
    | 'data_gap'
    | 'unknown';
```

Use `unknown` when:

- GPS is invalid;
- speed and coordinates conflict;
- activity input is missing;
- telemetry is malformed;
- the point quality is too poor.

This is not required for the first version, but the processing design should allow it later.

---

# 10. Telemetry Normalisation

Different trackers and vendors may expose different field names.

The report engine should not process vendor-specific raw records directly.

First convert each record into a normalised internal structure.

```ts
type TelemetryPoint = {
    id: bigint | number | string;
    timestamp: string;

    latitude: number;
    longitude: number;

    speedKph: number | null;
    heading: number | null;
    altitude: number | null;

    ignitionOn: boolean | null;
    activityOn: boolean | null;

    movementDetected: boolean | null;
    gpsValid: boolean;

    parameters?: Record<string, unknown>;
};
```

The normalisation layer is responsible for mapping:

- vendor speed field to `speedKph`;
- digital inputs to `activityOn`;
- ignition parameter to `ignitionOn`;
- coordinates to decimal latitude and longitude;
- timestamp to UTC;
- invalid coordinates to `gpsValid = false`.

---

# 11. Activity Signal Resolution

Vehicle activity should be resolved in a consistent order.

Example priority:

1. Explicit PTO or configured work input
2. Engine-running parameter
3. Ignition
4. Device activity state
5. Unknown

Example:

```ts
function resolveActivity(point: TelemetryPoint): {
    active: boolean | null;
    source: ActivitySource;
} {
    if (point.parameters?.pto === true) {
        return { active: true, source: 'pto' };
    }

    if (point.parameters?.engine_running === true) {
        return { active: true, source: 'engine' };
    }

    if (point.ignitionOn !== null) {
        return {
            active: point.ignitionOn,
            source: 'ignition',
        };
    }

    if (point.activityOn !== null) {
        return {
            active: point.activityOn,
            source: 'device_activity',
        };
    }

    return {
        active: null,
        source: 'unknown',
    };
}
```

The report must distinguish:

- activity is false;
- activity is true;
- activity is unknown.

Do not silently treat `null` as `false`.

---

# 12. Movement Detection

Movement should not rely on a single field.

Possible movement indicators:

- GPS speed;
- distance from the previous valid point;
- device movement flag;
- accelerometer;
- ignition and location change;
- odometer change.

A reasonable initial rule:

```ts
const isMoving =
    speedKph >= movingSpeedKph ||
    distanceFromPreviousMeters >= minimumMovementMeters ||
    movementDetected === true;
```

Recommended starting values for a vehicle tracker:

```ts
const vehicleJourneyConfig = {
    movingSpeedKph: 5,
    minimumMovementMeters: 25,
    staticConfirmationSeconds: 120,
    journeyEndSeconds: 180,
    maximumPointGapSeconds: 300,
};
```

These are starting values only.

They must be configurable in code and should eventually be configurable per tracker profile.

---

# 13. GPS Noise Filtering

GPS drift can make a parked asset appear to move.

The engine should reduce false journeys by applying:

- minimum speed;
- minimum distance;
- consecutive-point confirmation;
- accuracy filtering when accuracy is available;
- invalid coordinate filtering;
- optional maximum plausible speed checks.

Recommended initial rule:

A journey should not start from one isolated noisy point.

Require either:

- two consecutive moving points; or
- cumulative movement above a threshold; or
- a movement flag plus coordinate change.

Example:

```ts
const confirmedMovement =
    consecutiveMovingPoints >= 2 ||
    bufferedMovementMeters >= 50;
```

---

# 14. Segment Detection Rules

Telemetry must be sorted in ascending timestamp order.

For each point, calculate:

- elapsed seconds from previous point;
- distance from previous valid point;
- speed;
- activity state;
- movement state;
- GPS validity.

---

## 14.1 Journey start

A journey starts when movement is confirmed after a stationary, active-static, unknown, or data-gap period.

Suggested rule:

```text
Two consecutive moving points
OR
50 metres cumulative movement
```

The journey start time may need to be backdated to the first buffered moving point.

---

## 14.2 Short stop inside a journey

A short stop should remain part of the journey.

Examples:

- traffic light;
- junction;
- brief loading;
- short pause.

If the vehicle becomes stationary for less than `staticConfirmationSeconds`, keep the points inside the current journey.

---

## 14.3 Journey to active static

Transition:

```text
journey
→ movement stops
→ activity remains true
→ stationary duration reaches threshold
→ active_static
```

The boundary should be backdated to the start of the confirmed stationary period.

This allows the journey to end at the true stopping time instead of two minutes later.

---

## 14.4 Journey to stationary

Transition:

```text
journey
→ movement stops
→ activity is false
→ stationary duration reaches journey-end threshold
→ stationary
```

The journey should be closed at the start of the confirmed inactive stationary period.

---

## 14.5 Active static to journey

Transition:

```text
active_static
→ confirmed movement
→ journey
```

Close the active-static segment and start a new journey.

---

## 14.6 Active static to stationary

Transition:

```text
active_static
→ activity changes to false
→ stationary
```

A small debounce may be required if the input can flicker.

---

## 14.7 Any state to data gap

Transition:

```text
elapsed time between points > maximumPointGapSeconds
```

Actions:

1. Close current segment.
2. Add a `data_gap` segment.
3. Start interpretation again from the next point.
4. Do not assume the route through the gap.

---

# 15. Buffering Requirement

Journey detection cannot always decide the final state immediately.

Example:

```text
10:00 vehicle stops
10:00:10 still stopped
10:00:20 still stopped
...
10:02 confirmed active static
```

The engine must temporarily buffer points while deciding whether the stop is:

- a short stop inside a journey;
- active static;
- stationary.

When the threshold is reached, the segment boundary should be backdated to the first buffered stationary point.

This avoids incorrect durations.

---

# 16. Simplified State Machine

```text
                         movement
        +--------------------------------------+
        |                                      v
  stationary -----------------------------> journey
      ^   ^                                   |   |
      |   | activity off                      |   | movement stops
      |   +---------------- active_static <---+   |
      |                           |                |
      +---------------------------+                |
                 activity off                      |
                                                   |
              point gap exceeds threshold          |
        any state ------------------------------> data_gap
```

---

# 17. Processing Pseudocode

```ts
function buildActivitySegments(
    points: TelemetryPoint[],
    config: JourneyConfig
): ActivitySegment[] {
    const sortedPoints = [...points].sort(
        (a, b) =>
            new Date(a.timestamp).getTime() -
            new Date(b.timestamp).getTime()
    );

    const segments: ActivitySegment[] = [];

    let currentSegment: MutableSegment | null = null;
    let previousPoint: TelemetryPoint | null = null;

    let pendingStationaryPoints: TelemetryPoint[] = [];
    let pendingMovementPoints: TelemetryPoint[] = [];

    for (const point of sortedPoints) {
        if (!point.gpsValid) {
            continue;
        }

        if (!previousPoint) {
            previousPoint = point;
            continue;
        }

        const secondsFromPrevious = getSecondsBetween(
            previousPoint.timestamp,
            point.timestamp
        );

        const distanceMeters = haversineMeters(
            previousPoint,
            point
        );

        if (secondsFromPrevious > config.maximumPointGapSeconds) {
            currentSegment = closeSegment(
                currentSegment,
                segments
            );

            segments.push(
                createDataGapSegment(previousPoint, point)
            );

            pendingStationaryPoints = [];
            pendingMovementPoints = [];
            previousPoint = point;
            continue;
        }

        const movement = resolveMovement(
            previousPoint,
            point,
            distanceMeters,
            config
        );

        const activity = resolveActivity(point);

        if (movement.isMoving) {
            pendingMovementPoints.push(point);
            pendingStationaryPoints = [];

            if (movementIsConfirmed(pendingMovementPoints, config)) {
                if (currentSegment?.type !== 'journey') {
                    currentSegment = closeSegment(
                        currentSegment,
                        segments
                    );

                    currentSegment = startJourneySegment(
                        pendingMovementPoints
                    );
                } else {
                    addPoints(
                        currentSegment,
                        pendingMovementPoints
                    );
                }

                pendingMovementPoints = [];
            }
        } else {
            pendingStationaryPoints.push(point);
            pendingMovementPoints = [];

            const stationarySeconds =
                getBufferedDurationSeconds(
                    pendingStationaryPoints
                );

            if (
                activity.active === true &&
                stationarySeconds >= config.staticConfirmationSeconds
            ) {
                if (currentSegment?.type !== 'active_static') {
                    currentSegment = closeSegmentAtBufferedStart(
                        currentSegment,
                        pendingStationaryPoints,
                        segments
                    );

                    currentSegment = startActiveStaticSegment(
                        pendingStationaryPoints,
                        activity.source
                    );
                }
            } else if (
                activity.active === false &&
                stationarySeconds >= config.journeyEndSeconds
            ) {
                if (currentSegment?.type !== 'stationary') {
                    currentSegment = closeSegmentAtBufferedStart(
                        currentSegment,
                        pendingStationaryPoints,
                        segments
                    );

                    currentSegment = startStationarySegment(
                        pendingStationaryPoints
                    );
                }
            } else {
                // Short stop. Keep it buffered until its final state is known.
            }
        }

        previousPoint = point;
    }

    closeSegment(currentSegment, segments);

    return segments;
}
```

This is conceptual pseudocode, not final production code.

---

# 18. Segment Structures

## 18.1 Shared types

```ts
type ActivitySource =
    | 'ignition'
    | 'pto'
    | 'engine'
    | 'digital_input'
    | 'device_activity'
    | 'unknown';

type ReportLocation = {
    latitude: number;
    longitude: number;
    address?: string | null;
};

type ReportPoint = {
    id: bigint | number | string;
    timestamp: string;

    latitude: number;
    longitude: number;

    speedKph: number | null;
    heading: number | null;
    altitude: number | null;

    ignitionOn: boolean | null;
    activityOn: boolean | null;

    parameters?: Record<string, unknown>;
};
```

---

## 18.2 Journey segment

```ts
type JourneySegment = {
    id: string;
    type: 'journey';

    startAt: string;
    endAt: string;
    durationSeconds: number;

    distanceMeters: number;
    averageSpeedKph: number | null;
    maximumSpeedKph: number | null;

    startLocation: ReportLocation;
    endLocation: ReportLocation;

    pointCount: number;
    points: ReportPoint[];

    endReason:
        | 'became_active_static'
        | 'became_stationary'
        | 'data_gap'
        | 'report_end';
};
```

---

## 18.3 Active-static segment

```ts
type ActiveStaticSegment = {
    id: string;
    type: 'active_static';

    startAt: string;
    endAt: string;
    durationSeconds: number;

    location: ReportLocation;

    pointCount: number;
    points: ReportPoint[];

    activitySource: ActivitySource;
};
```

---

## 18.4 Stationary segment

```ts
type StationarySegment = {
    id: string;
    type: 'stationary';

    startAt: string;
    endAt: string;
    durationSeconds: number;

    location: ReportLocation;

    pointCount: number;
    points: ReportPoint[];
};
```

---

## 18.5 Data-gap segment

```ts
type DataGapSegment = {
    id: string;
    type: 'data_gap';

    startAt: string;
    endAt: string;
    durationSeconds: number;

    previousLocation: ReportLocation | null;
    nextLocation: ReportLocation | null;
};
```

---

## 18.6 Timeline point for sparse assets

```ts
type TimelineObservation = {
    id: string;
    type: 'observation';

    timestamp: string;
    location: ReportLocation;

    batteryPercent?: number | null;
    movementDetected?: boolean | null;
    communicationStatus?: string | null;

    changedPositionSincePrevious: boolean;
    distanceFromPreviousMeters?: number | null;

    parameters?: Record<string, unknown>;
};
```

---

# 19. API Design

## 19.1 Endpoint

Recommended initial endpoint:

```http
POST /api/reports/activity
```

POST is appropriate because report filters may become more complex than query-string parameters.

---

## 19.2 Request

Version 1:

```ts
type ActivityReportRequest = {
    asset_uuid: string;
    from: string;
    to: string;
};
```

Future:

```ts
type ActivityReportRequest = {
    asset_uuid?: string;
    group_uuid?: string;

    from: string;
    to: string;

    mode?: 'auto' | 'journey' | 'timeline';

    include_points?: boolean;
    parameters?: string[];
};
```

Do not accept both `asset_uuid` and `group_uuid` unless multi-target behaviour is explicitly implemented.

---

## 19.3 Response

```ts
type ActivityReportResponse = {
    report: {
        from: string;
        to: string;
        generatedAt: string;

        organisationId: number;
        mode: 'journey' | 'timeline';

        timezone: string;
    };

    subject: {
        assetId: number;
        assetUuid: string;
        assetName: string;

        trackerType: 'vehicle' | 'personal' | 'asset';

        deviceId?: number;
        deviceExternalId?: string;
    };

    summary: {
        firstPointAt: string | null;
        lastPointAt: string | null;

        pointCount: number;
        journeyCount: number;

        totalDistanceMeters: number;
        movingSeconds: number;
        activeStaticSeconds: number;
        stationarySeconds: number;
        communicationGapSeconds: number;
    };

    segments: ActivitySegment[] | TimelineObservation[];
};
```

---

## 19.4 Example response

```json
{
  "report": {
    "from": "2026-07-12T06:00:00Z",
    "to": "2026-07-12T18:00:00Z",
    "generatedAt": "2026-07-12T18:10:00Z",
    "organisationId": 1,
    "mode": "journey",
    "timezone": "Europe/Malta"
  },
  "subject": {
    "assetId": 45,
    "assetUuid": "be719108-c9dd-4ec3-a452-9de84941ddbf",
    "assetName": "Cherry Picker 01",
    "trackerType": "vehicle",
    "deviceId": 78,
    "deviceExternalId": "352093081234567"
  },
  "summary": {
    "firstPointAt": "2026-07-12T07:03:00Z",
    "lastPointAt": "2026-07-12T16:48:00Z",
    "pointCount": 648,
    "journeyCount": 3,
    "totalDistanceMeters": 28450,
    "movingSeconds": 6840,
    "activeStaticSeconds": 10920,
    "stationarySeconds": 7330,
    "communicationGapSeconds": 0
  },
  "segments": [
    {
      "id": "segment-1",
      "type": "journey",
      "startAt": "2026-07-12T07:03:00Z",
      "endAt": "2026-07-12T07:41:00Z",
      "durationSeconds": 2280,
      "distanceMeters": 12400,
      "averageSpeedKph": 19.6,
      "maximumSpeedKph": 58,
      "startLocation": {
        "latitude": 35.825,
        "longitude": 14.526
      },
      "endLocation": {
        "latitude": 35.874,
        "longitude": 14.482
      },
      "pointCount": 132,
      "points": [],
      "endReason": "became_active_static"
    },
    {
      "id": "segment-2",
      "type": "active_static",
      "startAt": "2026-07-12T07:41:00Z",
      "endAt": "2026-07-12T10:08:00Z",
      "durationSeconds": 8820,
      "location": {
        "latitude": 35.874,
        "longitude": 14.482
      },
      "pointCount": 245,
      "points": [],
      "activitySource": "pto"
    }
  ]
}
```

The example omits detailed points for readability.

---

# 20. Organisation and Permission Rules

The report must always run in the current active organisation context from the JWT.

The endpoint must:

1. Read the active organisation ID from authenticated request context.
2. Find the selected asset.
3. Confirm the asset belongs to the active organisation.
4. Confirm the user has access to the asset.
5. Reject unauthorised access before querying telemetry.
6. Never trust an organisation ID supplied by the frontend.

Groups must not grant access.

When group support is added:

```text
effective assets =
assets in selected group
INTERSECT
assets accessible to the current user
```

Never use a union.

---

# 21. Time Zones

Telemetry should be stored and processed in UTC.

The report response should include the display time zone.

Recommended behaviour:

- request timestamps are converted to UTC;
- backend calculations use UTC;
- frontend displays times using organisation time zone;
- export later uses the selected or organisation time zone.

Do not perform duration calculations on formatted local strings.

---

# 22. Distance Calculation

For the first version, distance can be calculated using Haversine distance between accepted consecutive points.

However, GPS noise must be filtered first.

Future improvements:

- use device odometer when reliable;
- compare GPS and odometer distance;
- map matching;
- maximum speed validation;
- ignore impossible jumps.

The response should always state distance in metres internally.

The frontend formats:

- metres;
- kilometres;
- miles, if unit settings are added later.

---

# 23. Summary Calculations

The summary should be derived from segments, not independently from raw points.

```ts
journeyCount =
    segments.filter(x => x.type === 'journey').length;

movingSeconds =
    sumDuration('journey');

activeStaticSeconds =
    sumDuration('active_static');

stationarySeconds =
    sumDuration('stationary');

communicationGapSeconds =
    sumDuration('data_gap');

totalDistanceMeters =
    sumJourneyDistances();
```

This keeps the summary consistent with the table and map.

---

# 24. Map Behaviour

## Journey

- draw a solid polyline;
- show start marker;
- show end marker;
- allow selecting the journey;
- show direction if practical later.

## Active Stationary

- show a distinct work/activity marker;
- display duration;
- show activity source.

## Stationary

- show a parked marker;
- long stationary periods may be visible by default;
- very short stationary periods may remain hidden.

## Data Gap

- do not draw a normal solid route;
- optionally draw a dotted connector;
- show gap duration.

## Sparse asset timeline

- show observation markers;
- optionally connect points with a dotted line;
- clearly communicate that the exact route is unknown.

---

# 25. Timeline Slider

The slider should be implemented after segmentation and map rendering are stable.

The slider represents chronological report time or chronological points.

When the user moves the slider:

- highlight the nearest report point;
- update the active map marker;
- select the related segment;
- scroll or highlight the corresponding table row;
- display timestamp and key telemetry.

The first slider version does not need automatic playback.

Later controls may include:

- play;
- pause;
- playback speed;
- next segment;
- previous segment.

---

# 26. Table Behaviour

The table should be grouped by activity segment.

Example:

```text
Journey 1
Active Stationary
Journey 2
Stationary
Journey 3
Data Gap
```

Recommended columns:

- Type
- Start
- End
- Duration
- Distance
- Start location
- End location
- Average speed
- Maximum speed
- Activity source
- Actions / expand

Not every column applies to every segment.

Use context-aware cells rather than forcing irrelevant values.

Example:

| Type | Start | End | Duration | Distance | Details |
|---|---|---|---:|---:|---|
| Journey | 07:03 | 07:41 | 38m | 12.4 km | Max 58 km/h |
| Active Stationary | 07:41 | 10:08 | 2h 27m | — | PTO |
| Stationary | 10:37 | 12:20 | 1h 43m | — | Parked |

Journey rows can expand to show detailed telemetry points.

---

# 27. Detailed Point View

The detailed view may include:

- timestamp;
- latitude;
- longitude;
- speed;
- heading;
- altitude;
- ignition;
- activity;
- battery;
- event name;
- device parameters.

Do not show every vendor parameter by default.

A later Parameter Report or configurable detail panel can expose selected parameters.

---

# 28. Reverse Geocoding

Addresses are useful but should not block version 1.

Version 1 may display:

- coordinates;
- map marker;
- optional known location name.

Later:

- reverse geocode segment start and end;
- cache results;
- avoid reverse-geocoding every raw point;
- respect API rate limits;
- store or cache normalised addresses.

Recommended targets for geocoding:

- journey start;
- journey end;
- long stationary point;
- active-static location.

---

# 29. Data Retrieval

The backend should fetch only telemetry required for:

- selected asset;
- selected date range;
- attached device;
- active organisation.

The query must be indexed by fields equivalent to:

- device ID;
- telemetry timestamp.

Recommended logical index:

```sql
CREATE INDEX ...
ON telemetry_table (device_id, happened_at);
```

The exact table name depends on the current telemetry schema.

Use ascending timestamp order.

---

# 30. Large Report Handling

The first version should enforce a maximum date range.

Suggested starting limit:

- vehicle tracker: 7 days;
- personal tracker: 14 days;
- asset tracker: 31–90 days.

These limits should be configurable.

For large datasets:

- exclude raw points by default;
- load detailed points on demand;
- simplify map geometry;
- paginate expanded details;
- move processing to Go later if needed;
- consider background report jobs.

---

# 31. Response Size Strategy

Returning every point inside every segment may create a very large response.

Recommended staged approach:

## Version 1

Return points because it simplifies map and table development, but use a short maximum date range.

## Later

Return:

- segment summaries;
- simplified map geometry;
- point count;
- separate endpoint for detailed points.

Example:

```http
GET /api/reports/activity/:reportId/segments/:segmentId/points
```

Do not introduce persisted report IDs until there is a real need.

---

# 32. Backend Ownership

The first implementation may be created in `web.backend.node.ts.api` because:

- authentication already exists;
- organisation context already exists;
- asset access already exists;
- development will be faster;
- the business rules still need to be validated.

A future `web.backend.go` service is a good fit for:

- report processing;
- segment calculation;
- large telemetry datasets;
- scheduled reports;
- alert processing;
- cron jobs.

Recommended evolution:

1. Define the API contract in Node/TypeScript.
2. Implement and validate the feature.
3. Keep the frontend contract stable.
4. Move processing to Go when appropriate.
5. Keep authentication and control-plane operations in Node.

Do not delay the report only to introduce Go immediately.

Alternatively, if Go practice is the main current goal, the segmentation engine can be implemented as a pure Go package behind a simple service endpoint, while Node still performs authentication and access checks.

---

# 33. Suggested Go Service Boundary Later

Possible flow:

```text
Vue frontend
    ↓
Node API
    - authenticate
    - active organisation
    - permission checks
    - asset access
    ↓
Go report service
    - fetch or receive telemetry
    - normalise points
    - segment activity
    - calculate summary
    ↓
Node API or direct internal response
    ↓
Vue frontend
```

Do not allow the internal report service to trust arbitrary organisation or asset IDs without an authenticated internal contract.

---

# 34. Error Responses

Recommended report errors:

## Validation error

```json
{
  "success": false,
  "message": "Invalid report filters.",
  "error": {
    "code": "REPORT_VALIDATION_ERROR"
  }
}
```

## Asset not found

```json
{
  "success": false,
  "message": "Asset not found.",
  "error": {
    "code": "ASSET_NOT_FOUND"
  }
}
```

## Access denied

```json
{
  "success": false,
  "message": "You do not have access to the selected asset.",
  "error": {
    "code": "ASSET_ACCESS_DENIED"
  }
}
```

## No telemetry

```json
{
  "success": true,
  "message": "No telemetry was found for the selected period.",
  "data": {
    "summary": {
      "pointCount": 0
    },
    "segments": []
  }
}
```

No telemetry is usually not a server error.

---

# 35. Auditing

Report generation should eventually be audited.

Audit fields:

- user ID;
- active organisation ID;
- asset ID;
- report type;
- from;
- to;
- generated timestamp;
- result point count;
- export type, when applicable;
- status;
- processing time.

For the first synchronous report, a basic audit event is enough.

---

# 36. Testing Strategy

## 36.1 Unit tests

Test pure functions:

- Haversine distance;
- movement resolution;
- activity resolution;
- journey start confirmation;
- short stop handling;
- active-static transition;
- stationary transition;
- data-gap creation;
- summary calculation;
- timeline mode behaviour.

---

## 36.2 Fixture scenarios

Create deterministic telemetry fixtures.

### Scenario A: simple journey

```text
stationary
moving for 30 minutes
stationary and inactive
```

Expected:

```text
Journey
Stationary
```

### Scenario B: traffic light

```text
moving
stopped 45 seconds
moving
```

Expected:

```text
One Journey
```

### Scenario C: cherry picker

```text
moving
stationary with PTO on for 2 hours
moving
stationary and inactive
```

Expected:

```text
Journey
Active Stationary
Journey
Stationary
```

### Scenario D: GPS drift

```text
parked points moving randomly within 10 metres
```

Expected:

```text
Stationary
```

### Scenario E: communication gap

```text
moving
no data for 30 minutes
moving
```

Expected:

```text
Journey
Data Gap
Journey
```

### Scenario F: sparse asset tracker

```text
one point every 6 hours
```

Expected:

```text
Timeline observations
No precise journeys
```

### Scenario G: missing activity signal

Expected:

- movement can still create journeys;
- non-moving state may be stationary or unknown;
- do not invent an active-static state.

---

## 36.3 Integration tests

Test:

- JWT organisation context;
- asset access;
- inaccessible asset rejection;
- telemetry query range;
- response schema;
- empty data;
- malformed telemetry;
- current organisation filtering.

---

## 36.4 Frontend tests

Test:

- filter validation;
- loading state;
- empty report state;
- error display;
- table grouping;
- map selection;
- row-to-map synchronisation;
- slider synchronisation later.

---

# 37. Logging and Observability

Log:

- report request;
- user ID;
- organisation ID;
- asset ID;
- selected time range;
- raw point count;
- accepted point count;
- rejected point count;
- segment count;
- processing duration;
- response size;
- errors.

Do not log full telemetry payloads by default.

---

# 38. Implementation Roadmap

## Phase 0 — Confirm Domain Rules

Before coding the segmentation engine, confirm:

- exact telemetry table;
- timestamp column;
- coordinate columns;
- speed unit;
- ignition parameter;
- PTO parameter;
- movement parameter;
- tracker category field;
- device-to-asset relation;
- organisation-to-asset relation;
- expected time zone.

Deliverable:

- written mapping from database fields to `TelemetryPoint`.

---

## Phase 1 — API Skeleton and Access

Build:

- route;
- Zod validation;
- active organisation handling;
- asset lookup;
- asset permission check;
- telemetry date-range query;
- empty result handling.

Do not implement journey detection yet.

Deliverable:

```json
{
  "subject": {},
  "rawPointCount": 123,
  "points": []
}
```

Acceptance criteria:

- unauthorised assets are rejected;
- only current-org data is used;
- date validation works;
- telemetry is sorted.

---

## Phase 2 — Normalisation

Build:

- vendor/raw telemetry mapper;
- UTC timestamp normalisation;
- speed conversion;
- coordinate validation;
- ignition mapping;
- activity mapping;
- movement mapping.

Deliverable:

```ts
TelemetryPoint[]
```

Acceptance criteria:

- report engine no longer depends on raw DB column names;
- invalid points are identified;
- null values remain distinct from false values.

---

## Phase 3 — Pure Segmentation Engine

Build pure functions without HTTP or database dependencies.

Functions may include:

```ts
normaliseTelemetry(...)
resolveMovement(...)
resolveActivity(...)
detectDataGap(...)
buildActivitySegments(...)
calculateSummary(...)
```

Deliverable:

```ts
{
    segments,
    summary
}
```

Acceptance criteria:

- fixture tests pass;
- traffic-light stops remain inside journeys;
- active-static work is detected;
- gaps are not bridged as normal routes;
- summary matches segments.

---

## Phase 4 — Table-First Frontend

Build:

- report filters;
- generate button;
- summary cards;
- grouped segment table;
- expandable journey detail;
- loading state;
- empty state;
- error state.

Do not build the slider yet.

Acceptance criteria:

- a user can understand the day without using the map;
- segment times and totals are correct;
- table rows match backend segments.

---

## Phase 5 — Map

Build:

- route polylines;
- journey start/end markers;
- active-static markers;
- stationary markers;
- gap display;
- selected-row highlighting.

Acceptance criteria:

- selecting a table row highlights the map segment;
- gaps are visually distinct;
- sparse or invalid points do not create misleading lines.

---

## Phase 6 — Timeline Slider

Build:

- chronological point list;
- slider;
- active marker;
- segment selection;
- table synchronisation.

Acceptance criteria:

- slider position selects the correct point;
- map and table remain synchronised;
- no automatic playback required.

---

## Phase 7 — Personal Tracker Support

Add tracker-specific config:

- lower movement speed threshold;
- longer stop confirmation;
- longer point-gap threshold;
- activity state disabled unless supported.

Acceptance criteria:

- personal movement periods are grouped reasonably;
- sparse intervals are not overinterpreted.

---

## Phase 8 — Asset Tracker Timeline Mode

Build:

- chronological observations;
- movement-since-previous flag;
- dotted map connection;
- no journey claims;
- battery/status fields.

Acceptance criteria:

- exact route is never implied;
- sparse position changes are clear.

---

## Phase 9 — Groups and Multiple Assets

Add:

- group filter;
- group membership resolution;
- access intersection;
- multiple-asset result layout.

Recommended initial multiple-asset behaviour:

- one summary per asset;
- one selected asset displayed on the map at a time.

Do not draw many full routes simultaneously by default.

---

## Phase 10 — Export

Recommended order:

1. CSV
2. Excel
3. PDF

CSV/Excel can expose detailed rows.

PDF should focus on:

- report summary;
- segment table;
- selected map image;
- important activity periods.

---

## Phase 11 — Auto Reports

After manual reports are stable:

- one-off scheduled report;
- daily;
- weekly;
- monthly;
- email recipients;
- report generation jobs;
- status and retry handling.

---

# 39. Suggested File and Module Structure

## Node/TypeScript example

```text
src/
  modules/
    reports/
      activity/
        activity-report.controller.ts
        activity-report.route.ts
        activity-report.schema.ts
        activity-report.service.ts

        domain/
          telemetry-point.types.ts
          activity-segment.types.ts
          journey-config.types.ts

        processing/
          normalise-telemetry.ts
          resolve-movement.ts
          resolve-activity.ts
          calculate-distance.ts
          build-activity-segments.ts
          calculate-summary.ts

        repositories/
          activity-report.repository.ts

        tests/
          fixtures/
          build-activity-segments.test.ts
          calculate-summary.test.ts
```

Keep segmentation logic pure and independent of Fastify and Prisma.

---

## Go example later

```text
internal/
  reports/
    activity/
      model.go
      normalise.go
      movement.go
      activity.go
      segmenter.go
      summary.go
      service.go
      segmenter_test.go
```

---

# 40. Configuration

Do not hard-code thresholds throughout the algorithm.

```ts
type JourneyConfig = {
    movingSpeedKph: number;
    minimumMovementMeters: number;

    movementConfirmationPoints: number;
    movementConfirmationMeters: number;

    staticConfirmationSeconds: number;
    journeyEndSeconds: number;

    maximumPointGapSeconds: number;

    maximumPlausibleSpeedKph?: number;
};
```

Example profiles:

```ts
const vehicleConfig: JourneyConfig = {
    movingSpeedKph: 5,
    minimumMovementMeters: 25,
    movementConfirmationPoints: 2,
    movementConfirmationMeters: 50,
    staticConfirmationSeconds: 120,
    journeyEndSeconds: 180,
    maximumPointGapSeconds: 300,
    maximumPlausibleSpeedKph: 220,
};

const personalConfig: JourneyConfig = {
    movingSpeedKph: 2,
    minimumMovementMeters: 20,
    movementConfirmationPoints: 2,
    movementConfirmationMeters: 40,
    staticConfirmationSeconds: 600,
    journeyEndSeconds: 600,
    maximumPointGapSeconds: 900,
    maximumPlausibleSpeedKph: 160,
};
```

These values require testing against real iotrack.live telemetry.

---

# 41. Important Revisions and Recommendations

## 41.1 Use “Activity Report” as the feature name

“Journey Report” is too narrow because the page also handles:

- active stationary work;
- parked periods;
- communication gaps;
- personal movement;
- sparse asset observations.

Use:

## **Activity Report**

Journey remains a segment type inside the report.

---

## 41.2 Build the table before the slider

The slider is valuable, but it depends on correct point ordering and segment detection.

Recommended priority:

1. Backend segments
2. Table
3. Map
4. Slider

---

## 41.3 Do not treat ignition as the only activity signal

A cherry picker may require PTO or another digital input.

Activity mapping should be configurable by tracker or asset profile.

---

## 41.4 Do not treat missing activity as inactive

`null` is not `false`.

Missing data should not silently classify productive work as parked time.

---

## 41.5 Do not create journeys for sparse asset trackers

Connect observations visually only with a clear indication that the route is unknown.

---

## 41.6 Keep the first report synchronous and limited

A synchronous endpoint is appropriate for a short date range.

Introduce background jobs only when processing time or export complexity requires them.

---

## 41.7 Keep the API contract independent of implementation language

The frontend should depend on the response schema, not on whether Node or Go performs the calculations.

---

## 41.8 Consider segment confidence later

A future enhancement can add:

```ts
confidence: 'high' | 'medium' | 'low';
```

Examples:

- high: speed, distance, and movement flag agree;
- medium: GPS distance only;
- low: sparse or conflicting data.

Not required for version 1.

---

## 41.9 Consider data quality metadata

Future response field:

```ts
dataQuality: {
    totalPoints: number;
    acceptedPoints: number;
    invalidGpsPoints: number;
    duplicatePoints: number;
    gapCount: number;
};
```

This is useful for debugging and customer support.

---

# 42. Open Questions for the Agent

The implementation agent should confirm these before finalising code:

1. Which telemetry table contains the source data?
2. Is there one telemetry table or several?
3. What is the timestamp column?
4. Are timestamps stored in UTC?
5. What is the speed unit in storage?
6. Is odometer data available and reliable?
7. Which parameter identifies ignition?
8. Which parameter identifies PTO or working activity?
9. Is there an existing movement flag?
10. Is GPS accuracy available?
11. How are tracker categories stored?
12. Can an asset change device during the selected period?
13. What should happen when the device assignment changes?
14. What maximum date range is acceptable?
15. Is reverse geocoding already available?
16. Which map library is used?
17. Does the frontend already have a reusable telemetry-map component?
18. Should very long stationary periods be included in the report?
19. Should report boundaries create partial segments?
20. Should a journey that began before the selected range be marked as partial?

---

# 43. Report Boundary Behaviour

A report may begin or end during an ongoing journey.

Recommended flags:

```ts
type SegmentBoundary = {
    startsBeforeReportRange: boolean;
    endsAfterReportRange: boolean;
};
```

For version 1, the system can calculate only within the selected period but should mark the segment as partial when possible.

To determine this accurately, fetch a small look-behind and look-ahead window.

Example:

- requested range: 08:00–18:00;
- fetch telemetry from 07:50–18:10;
- display only 08:00–18:00;
- use extra points to determine state at boundaries.

This is a recommended improvement because otherwise the first point may incorrectly appear to start a new journey.

---

# 44. Duplicate and Out-of-Order Points

Before segmentation:

- sort by timestamp;
- remove exact duplicates;
- decide how to handle same-timestamp conflicts;
- reject malformed coordinates;
- reject impossible timestamps;
- optionally reject impossible jumps.

Do not assume ingestion order is always chronological.

---

# 45. Asset-to-Device History

A future concern is device reassignment.

If an asset can be assigned to different trackers over time, the report query must use assignment history rather than only the current device.

For version 1, document the assumption:

> The selected asset uses its currently assigned device for the entire requested period.

If this assumption is not valid, assignment history must be implemented before the report is considered fully correct.

---

# 46. Acceptance Criteria for the First Production Milestone

The first milestone is complete when:

- [ ] User selects one vehicle asset.
- [ ] User selects a valid date/time range.
- [ ] Backend verifies active organisation.
- [ ] Backend verifies asset access.
- [ ] Telemetry is loaded and normalised.
- [ ] GPS noise does not create obvious false journeys.
- [ ] Journeys are detected.
- [ ] Active-stationary work is detected from configured activity input.
- [ ] Short stops remain inside journeys.
- [ ] Parked periods are shown.
- [ ] Data gaps are shown and not bridged as normal routes.
- [ ] Summary totals match segment totals.
- [ ] Table displays segments chronologically.
- [ ] Map displays journeys and state markers.
- [ ] Empty telemetry returns a valid empty report.
- [ ] Unit and integration tests cover core scenarios.
- [ ] Processing time and point count are logged.

The slider is not required for the first production milestone.

---

# 47. Final Recommended Build Order

1. Confirm raw telemetry mapping.
2. Define API request and response types.
3. Build route and permission checks.
4. Fetch raw telemetry.
5. Normalise telemetry.
6. Write fixture-based unit tests.
7. Build pure segmentation engine.
8. Build summary calculation.
9. Return activity report response.
10. Build frontend filters.
11. Build summary cards.
12. Build grouped table.
13. Validate with real cherry-picker data.
14. Tune thresholds.
15. Build map.
16. Add table/map synchronisation.
17. Add slider.
18. Add personal tracker profile.
19. Add asset timeline mode.
20. Add groups.
21. Add exports.
22. Add auto reports.
23. Consider moving report processing to Go.

---

# 48. Final Product Principle

The report must avoid claiming more certainty than the telemetry supports.

For high-frequency vehicle data, the system can provide detailed journeys and operational states.

For lower-frequency personal data, it can provide approximate movement periods.

For sparse asset data, it should provide observations and movement history without inventing exact routes.

The goal is not only to display telemetry.

The goal is to help the operator understand:

> Where was the asset, when did it move, when did it stop, when was it still working, and where is the data uncertain?

That is the central purpose of the iotrack.live Activity Report.
