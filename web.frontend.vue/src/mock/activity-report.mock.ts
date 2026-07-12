// Mock Activity Report — placeholder UI only, no backend involved.
//
// Deliberately awkward data (see ACTIVITY_REPORT_UI_ROADMAP.md guardrail 3).
// A clean three-journey day would produce a UI that looks great and then breaks
// on real telemetry, so this fixture covers the cases from design doc §36.2:
//
//   - a journey that started BEFORE the report window (partial boundary, §43)
//   - a short stop inside a journey that must NOT split it (traffic light, §14.2)
//   - active_static work with PTO (cherry picker, scenario C)
//   - a communication gap with no points and an unknown route (§8.4)
//   - a stationary period still running at the report end (partial boundary)
//
// Coordinates are around Malta. Intended to double as a backend segmentation
// test fixture later.

import type {
    ActiveStaticSegment,
    ActivityReportResponse,
    ActivityReportSummary,
    ActivitySegment,
    DataGapSegment,
    JourneySegment,
    ReportPoint,
    StationarySegment,
    TimelineObservation,
} from '@/types/activity-report.type';

// - Helpers -----------------------------------------------------------

type LatLng = [number, number];

let pointId = 0;

function iso(time: string): string {
    return `2026-07-12T${time}Z`;
}

function secondsBetween(startAt: string, endAt: string): number {
    return (new Date(endAt).getTime() - new Date(startAt).getTime()) / 1000;
}

/** Position a fraction `t` (0..1) along a polyline of waypoints. */
function pointOnPath(path: LatLng[], t: number): LatLng {
    const span = (path.length - 1) * Math.min(Math.max(t, 0), 1);
    const i = Math.min(Math.floor(span), path.length - 2);
    const local = span - i;

    const [lat1, lng1] = path[i];
    const [lat2, lng2] = path[i + 1];

    return [
        lat1 + (lat2 - lat1) * local,
        lng1 + (lng2 - lng1) * local,
    ];
}

/**
 * Evenly spaced points along a path. `stopAt` marks a fraction of the journey
 * where the vehicle pauses (speed 0) without the segment being split.
 */
function buildPoints(opts: {
    startAt: string;
    endAt: string;
    path: LatLng[];
    count: number;
    speedKph: number;
    ignitionOn: boolean | null;
    activityOn: boolean | null;
    stopAt?: { from: number; to: number };
}): ReportPoint[] {
    const { startAt, endAt, path, count, speedKph, ignitionOn, activityOn, stopAt } = opts;

    const start = new Date(startAt).getTime();
    const total = new Date(endAt).getTime() - start;

    return Array.from({ length: count }, (_, i) => {
        const t = count === 1 ? 0 : i / (count - 1);
        const [latitude, longitude] = pointOnPath(path, t);

        const paused = !!stopAt && t >= stopAt.from && t <= stopAt.to;

        // Vary the speed a little so the detail view isn't suspiciously flat.
        const speed = paused
            ? 0
            : Math.round(speedKph * (0.7 + 0.6 * Math.abs(Math.sin(i))));

        return {
            id: String(++pointId),
            timestamp: new Date(start + total * t).toISOString(),
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6)),
            speedKph: speed,
            heading: Math.round((i * 37) % 360),
            altitude: 20 + (i % 15),
            ignitionOn,
            activityOn,
        };
    });
}

// - Places ------------------------------------------------------------

const DEPOT: LatLng = [35.8825, 14.5090];
const MOSTA: LatLng = [35.9092, 14.4258];
const MGARR: LatLng = [35.9375, 14.3754];
const MARSA: LatLng = [35.8617, 14.4885];
const RESUME: LatLng = [35.8410, 14.5390]; // where data comes back after the gap

const loc = ([latitude, longitude]: LatLng) => ({ latitude, longitude });

// - Segments ----------------------------------------------------------

// Journey already under way when the report window opens (§43), and containing
// a short stop that must stay INSIDE the journey (§14.2).
const journey1: JourneySegment = {
    id: 'segment-1',
    type: 'journey',
    startAt: iso('06:00:00'),
    endAt: iso('06:38:00'),
    durationSeconds: 2280,
    distanceMeters: 12400,
    averageSpeedKph: 19.6,
    maximumSpeedKph: 58,
    startLocation: loc(DEPOT),
    endLocation: loc(MOSTA),
    endReason: 'became_active_static',
    boundary: { startsBeforeReportRange: true, endsAfterReportRange: false },
    points: buildPoints({
        startAt: iso('06:00:00'),
        endAt: iso('06:38:00'),
        path: [DEPOT, [35.8901, 14.4802], [35.8985, 14.4501], MOSTA],
        count: 40,
        speedKph: 40,
        ignitionOn: true,
        activityOn: false,
        stopAt: { from: 0.45, to: 0.52 }, // traffic light — must not split the journey
    }),
    pointCount: 0,
};

// Cherry picker: stationary but working (scenario C).
const activeStatic: ActiveStaticSegment = {
    id: 'segment-2',
    type: 'active_static',
    startAt: iso('06:38:00'),
    endAt: iso('09:05:00'),
    durationSeconds: 8820,
    location: loc(MOSTA),
    activitySource: 'pto',
    points: buildPoints({
        startAt: iso('06:38:00'),
        endAt: iso('09:05:00'),
        path: [MOSTA, MOSTA],
        count: 30,
        speedKph: 0,
        ignitionOn: true,
        activityOn: true,
    }),
    pointCount: 0,
};

const journey2: JourneySegment = {
    id: 'segment-3',
    type: 'journey',
    startAt: iso('09:05:00'),
    endAt: iso('09:34:00'),
    durationSeconds: 1740,
    distanceMeters: 8100,
    averageSpeedKph: 16.8,
    maximumSpeedKph: 47,
    startLocation: loc(MOSTA),
    endLocation: loc(MGARR),
    endReason: 'became_stationary',
    points: buildPoints({
        startAt: iso('09:05:00'),
        endAt: iso('09:34:00'),
        path: [MOSTA, [35.9235, 14.4010], MGARR],
        count: 28,
        speedKph: 35,
        ignitionOn: true,
        activityOn: false,
    }),
    pointCount: 0,
};

const stationary1: StationarySegment = {
    id: 'segment-4',
    type: 'stationary',
    startAt: iso('09:34:00'),
    endAt: iso('11:17:00'),
    durationSeconds: 6180,
    location: loc(MGARR),
    points: buildPoints({
        startAt: iso('09:34:00'),
        endAt: iso('11:17:00'),
        path: [MGARR, MGARR],
        count: 20,
        speedKph: 0,
        ignitionOn: false,
        activityOn: false,
    }),
    pointCount: 0,
};

const journey3: JourneySegment = {
    id: 'segment-5',
    type: 'journey',
    startAt: iso('11:17:00'),
    endAt: iso('12:02:00'),
    durationSeconds: 2700,
    distanceMeters: 15300,
    averageSpeedKph: 20.4,
    maximumSpeedKph: 62,
    startLocation: loc(MGARR),
    endLocation: loc(MARSA),
    endReason: 'data_gap',
    points: buildPoints({
        startAt: iso('11:17:00'),
        endAt: iso('12:02:00'),
        path: [MGARR, [35.9002, 14.4200], MARSA],
        count: 44,
        speedKph: 45,
        ignitionOn: true,
        activityOn: false,
    }),
    pointCount: 0,
};

// 30 minutes of silence. No points, and the route between the two ends is
// unknown — the map must never draw a solid line through this (§8.4).
const dataGap: DataGapSegment = {
    id: 'segment-6',
    type: 'data_gap',
    startAt: iso('12:02:00'),
    endAt: iso('12:32:00'),
    durationSeconds: 1800,
    previousLocation: loc(MARSA),
    nextLocation: loc(RESUME),
};

const journey4: JourneySegment = {
    id: 'segment-7',
    type: 'journey',
    startAt: iso('12:32:00'),
    endAt: iso('13:14:00'),
    durationSeconds: 2520,
    distanceMeters: 9800,
    averageSpeedKph: 14.0,
    maximumSpeedKph: 51,
    startLocation: loc(RESUME),
    endLocation: loc(DEPOT),
    endReason: 'became_stationary',
    points: buildPoints({
        startAt: iso('12:32:00'),
        endAt: iso('13:14:00'),
        path: [RESUME, [35.8600, 14.5250], DEPOT],
        count: 36,
        speedKph: 30,
        ignitionOn: true,
        activityOn: false,
    }),
    pointCount: 0,
};

// Still parked when the report window closes (partial boundary, §43).
const stationary2: StationarySegment = {
    id: 'segment-8',
    type: 'stationary',
    startAt: iso('13:14:00'),
    endAt: iso('18:00:00'),
    durationSeconds: 17160,
    location: loc(DEPOT),
    boundary: { startsBeforeReportRange: false, endsAfterReportRange: true },
    points: buildPoints({
        startAt: iso('13:14:00'),
        endAt: iso('18:00:00'),
        path: [DEPOT, DEPOT],
        count: 24,
        speedKph: 0,
        ignitionOn: false,
        activityOn: false,
    }),
    pointCount: 0,
};

const segments: ActivitySegment[] = [
    journey1,
    activeStatic,
    journey2,
    stationary1,
    journey3,
    dataGap,
    journey4,
    stationary2,
];

// Keep pointCount honest rather than hand-typed.
for (const segment of segments) {
    if ('points' in segment) {
        segment.pointCount = segment.points.length;
    }
}

// - Summary -----------------------------------------------------------

/** Derived from the segments, never computed independently (§23). */
function deriveSummary(all: ActivitySegment[]): ActivityReportSummary {
    const totalFor = (type: ActivitySegment['type']) =>
        all.filter(s => s.type === type)
            .reduce((sum, s) => sum + s.durationSeconds, 0);

    const journeys = all.filter((s): s is JourneySegment => s.type === 'journey');
    const points = all.flatMap(s => ('points' in s ? s.points : []));

    return {
        firstPointAt: points[0]?.timestamp ?? null,
        lastPointAt: points[points.length - 1]?.timestamp ?? null,

        pointCount: points.length,
        journeyCount: journeys.length,

        totalDistanceMeters: journeys.reduce((sum, j) => sum + j.distanceMeters, 0),
        movingSeconds: totalFor('journey'),
        activeStaticSeconds: totalFor('active_static'),
        stationarySeconds: totalFor('stationary'),
        communicationGapSeconds: totalFor('data_gap'),
    };
}

// - Report ------------------------------------------------------------

export const mockActivityReport: ActivityReportResponse = {
    report: {
        from: iso('06:00:00'),
        to: iso('18:00:00'),
        generatedAt: iso('18:10:00'),
        organisationId: 1,
        mode: 'journey',
        timezone: 'Europe/Malta',
    },

    subject: {
        assetId: 45,
        assetUuid: 'be719108-c9dd-4ec3-a452-9de84941ddbf',
        assetName: 'Cherry Picker 01',
        trackerType: 'vehicle',
        deviceId: 78,
        deviceExternalId: '352093081234567',
    },

    summary: deriveSummary(segments),

    segments,
};

// - Timeline mode (sparse asset tracker) ------------------------------
//
// A trailer that reports every few hours. We know it moved; we do NOT know
// when it left, what route it took, or where it stopped (§3.3). So the report
// lists sightings — no journeys, no durations, no speeds (§41.5).

const VALLETTA: LatLng = [35.8989, 14.5146];
const GOZO: LatLng = [36.0443, 14.2513];

function observation(opts: {
    id: string;
    time: string;
    at: LatLng;
    moved: boolean;
    distanceFromPreviousMeters?: number | null;
    batteryPercent: number;
}): TimelineObservation {
    return {
        id: opts.id,
        type: 'observation',
        timestamp: iso(opts.time),
        location: loc(opts.at),
        batteryPercent: opts.batteryPercent,
        movementDetected: opts.moved,
        communicationStatus: 'ok',
        changedPositionSincePrevious: opts.moved,
        distanceFromPreviousMeters: opts.distanceFromPreviousMeters ?? null,
    };
}

const observations: TimelineObservation[] = [
    observation({ id: 'obs-1', time: '02:00:00', at: VALLETTA, moved: false, batteryPercent: 92 }),
    observation({ id: 'obs-2', time: '08:00:00', at: VALLETTA, moved: false, distanceFromPreviousMeters: 0, batteryPercent: 90 }),
    observation({ id: 'obs-3', time: '14:00:00', at: MOSTA, moved: true, distanceFromPreviousMeters: 8200, batteryPercent: 88 }),
    observation({ id: 'obs-4', time: '20:00:00', at: GOZO, moved: true, distanceFromPreviousMeters: 27400, batteryPercent: 85 }),
];

export const mockTimelineReport: ActivityReportResponse = {
    report: {
        from: iso('00:00:00'),
        to: iso('23:59:59'),
        generatedAt: iso('23:59:59'),
        organisationId: 1,
        mode: 'timeline',
        timezone: 'Europe/Malta',
    },

    subject: {
        assetId: 88,
        assetUuid: 'c4f0a1d2-7e35-4b91-9f22-1a7c5d3e8b40',
        assetName: 'Trailer 07',
        trackerType: 'asset',
        deviceId: 91,
        deviceExternalId: '352093089876543',
    },

    // Most journey-mode figures are unknowable here, so they stay zero rather
    // than being invented. The UI shows a different set of cards for timeline.
    summary: {
        firstPointAt: observations[0].timestamp,
        lastPointAt: observations[observations.length - 1].timestamp,
        pointCount: observations.length,
        journeyCount: 0,
        totalDistanceMeters: observations.reduce(
            (sum, o) => sum + (o.distanceFromPreviousMeters ?? 0), 0
        ),
        movingSeconds: 0,
        activeStaticSeconds: 0,
        stationarySeconds: 0,
        communicationGapSeconds: 0,
    },

    segments: observations,
};

/** An asset with no telemetry in the period — a valid, empty report (§34). */
export const mockEmptyActivityReport: ActivityReportResponse = {
    ...mockActivityReport,
    summary: {
        firstPointAt: null,
        lastPointAt: null,
        pointCount: 0,
        journeyCount: 0,
        totalDistanceMeters: 0,
        movingSeconds: 0,
        activeStaticSeconds: 0,
        stationarySeconds: 0,
        communicationGapSeconds: 0,
    },
    segments: [],
};
