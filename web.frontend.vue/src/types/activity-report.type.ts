// Activity Report contract.
// Transcribed from docs/iotrack_activity_report_design.md §18 and §19.3.
// The frontend depends on this schema, not on which service computes it (§41.7).
// Distances are metres and speeds km/h; the UI formats, the data stays raw (§22).

export type ActivityState =
    | 'journey'
    | 'active_static'
    | 'stationary'
    | 'data_gap';

export type ActivitySource =
    | 'ignition'
    | 'pto'
    | 'engine'
    | 'digital_input'
    | 'device_activity'
    | 'unknown';

export type TrackerType = 'vehicle' | 'personal' | 'asset';

export type ReportMode = 'journey' | 'timeline';

export interface ReportLocation {
    latitude: number;
    longitude: number;
    address?: string | null;
}

export interface ReportPoint {
    id: string;
    timestamp: string; // ISO, UTC

    latitude: number;
    longitude: number;

    speedKph: number | null;
    heading: number | null;
    altitude: number | null;

    ignitionOn: boolean | null;
    activityOn: boolean | null;

    parameters?: Record<string, unknown>;
}

// Segments may be clipped by the report window (§43).
export interface SegmentBoundary {
    startsBeforeReportRange: boolean;
    endsAfterReportRange: boolean;
}

interface SegmentBase {
    id: string;
    startAt: string;
    endAt: string;
    durationSeconds: number;
    boundary?: SegmentBoundary;
}

export interface JourneySegment extends SegmentBase {
    type: 'journey';

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
}

export interface ActiveStaticSegment extends SegmentBase {
    type: 'active_static';

    location: ReportLocation;

    pointCount: number;
    points: ReportPoint[];

    activitySource: ActivitySource;
}

export interface StationarySegment extends SegmentBase {
    type: 'stationary';

    location: ReportLocation;

    pointCount: number;
    points: ReportPoint[];
}

// The route through a gap is unknown and must never be drawn as one (§8.4).
export interface DataGapSegment extends SegmentBase {
    type: 'data_gap';

    previousLocation: ReportLocation | null;
    nextLocation: ReportLocation | null;
}

export type ActivitySegment =
    | JourneySegment
    | ActiveStaticSegment
    | StationarySegment
    | DataGapSegment;

// Sparse asset trackers report observations, not journeys (§18.6).
export interface TimelineObservation {
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
}

export interface ActivityReportSummary {
    firstPointAt: string | null;
    lastPointAt: string | null;

    pointCount: number;
    journeyCount: number;

    totalDistanceMeters: number;
    movingSeconds: number;
    activeStaticSeconds: number;
    stationarySeconds: number;
    communicationGapSeconds: number;
}

export interface ActivityReportSubject {
    assetId: number;
    assetUuid: string;
    assetName: string;

    trackerType: TrackerType;

    // Reflects the currently assigned device; may not apply to every point (§45).
    deviceId?: number;
    deviceExternalId?: string;
}

export interface ActivityReportResponse {
    report: {
        from: string;
        to: string;
        generatedAt: string;

        organisationId: number;
        mode: ReportMode;

        timezone: string;
    };

    subject: ActivityReportSubject;

    summary: ActivityReportSummary;

    segments: ActivitySegment[] | TimelineObservation[];
}

export interface ActivityReportRequest {
    asset_uuid: string;
    from: string;
    to: string;
    // Overrides the stationary/active_static confirmation window (§14.3/
    // §14.4). Seconds, 180-900 (3-15 min). Omitted -> the backend's
    // per-profile default.
    stationary_window_seconds?: number;
}
