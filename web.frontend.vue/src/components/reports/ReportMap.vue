<template>
    <div class="rmap">
        <GoogleMap
            v-if="apiKey"
            ref="mapRef"
            :api-key="apiKey"
            :center="fallbackCenter"
            :zoom="12"
            :mapId="'9e8ca8994cbac798'"
            gesture-handling="cooperative"
            style="width: 100%; height: 100%"
        >
            <template v-for="segment in segments" :key="segment.id">

                <!-- Journey: the route is known, so draw it solid. -->
                <template v-if="segment.type === 'journey'">
                    <Polyline
                        :options="journeyLine(segment)"
                        @click="emit('select', segment.id)"
                    />
                    <Marker :options="markerFor(segment.startLocation, 'start', 'Journey start')" />
                    <Marker :options="markerFor(segment.endLocation, 'end', 'Journey end')" />
                </template>

                <!-- Stationary but working. -->
                <Marker
                    v-else-if="segment.type === 'active_static'"
                    :options="markerFor(segment.location, 'active_static', activeStaticTitle(segment))"
                    @click="emit('select', segment.id)"
                />

                <!-- Parked. -->
                <Marker
                    v-else-if="segment.type === 'stationary'"
                    :options="markerFor(segment.location, 'stationary', `Parked · ${formatDuration(segment.durationSeconds)}`)"
                    @click="emit('select', segment.id)"
                />

                <!-- Data gap: the route between the ends is UNKNOWN. Dashed, never
                     a solid route, so it can't be mistaken for a travelled path (§8.4). -->
                <Polyline
                    v-else-if="segment.type === 'data_gap' && gapPath(segment)"
                    :options="gapLine(segment)"
                    @click="emit('select', segment.id)"
                />

            </template>

            <!-- Where the asset was at the telemetry point picked in the table.
                 Drawn last so it sits above the routes. -->
            <Marker v-if="selectedPoint" :options="pointMarker(selectedPoint)" />

            <!-- Timeline mode: sightings only. The connector is dashed because
                 the route between them is unknown and must not be implied (§41.5). -->
            <template v-if="observations.length">
                <Polyline :options="sightingsLine()" />

                <Marker
                    v-for="observation in observations"
                    :key="observation.id"
                    :options="markerFor(
                        observation.location,
                        'observation',
                        `Seen ${formatDateTime(observation.timestamp, timezone)}`,
                    )"
                    @click="emit('select', observation.id)"
                />
            </template>
        </GoogleMap>

        <div v-else class="rmap__loading">Loading map…</div>

        <!-- Details for the telemetry point picked in the table. Sits in the
             corner rather than over the arrow, which it would otherwise hide. -->
        <div v-if="selectedPoint" class="rpin">
            <div class="rpin__time">{{ formatTime(selectedPoint.timestamp, timezone) }}</div>

            <div class="rpin__rows">
                <span class="rpin__label">Speed</span>
                <span class="rpin__value">{{ formatSpeed(selectedPoint.speedKph) }}</span>

                <span class="rpin__label">Ignition</span>
                <span class="rpin__value">{{ boolLabel(selectedPoint.ignitionOn) }}</span>

                <span class="rpin__label">Activity</span>
                <span class="rpin__value">{{ boolLabel(selectedPoint.activityOn) }}</span>

                <span class="rpin__label">Position</span>
                <span class="rpin__value">
                    {{ formatCoords(selectedPoint.latitude, selectedPoint.longitude) }}
                </span>
            </div>
        </div>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';

import { useSettingsStore } from '@/stores/settingsStore';
import type {
    ActiveStaticSegment,
    ActivitySegment,
    DataGapSegment,
    JourneySegment,
    ReportLocation,
    ReportPoint,
    TimelineObservation,
} from '@/types/activity-report.type';
import {
    bearingBetween,
    formatCoords,
    formatDateTime,
    formatDuration,
    formatSpeed,
    formatTime,
} from '@/utils/report.utils';

// - Props & Emits -----------------------------------------------------

const props = withDefaults(defineProps<{
    segments: ActivitySegment[];
    observations?: TimelineObservation[];
    timezone?: string;
    selectedSegmentId: string | null;
    selectedPoint?: ReportPoint | null;
}>(), {
    observations: () => [],
    timezone: 'UTC',
    selectedPoint: null,
});

const emit = defineEmits<{
    (e: 'select', id: string): void
}>();

// - Store -------------------------------------------------------------

const settingsStore = useSettingsStore();
const { getMapsApiKey: apiKey } = storeToRefs(settingsStore);

// - Data --------------------------------------------------------------

const mapRef = ref<any>(null);

// Malta; only used until the report's own bounds are applied.
const fallbackCenter = { lat: 35.9, lng: 14.45 };

// Same colour language as the summary cards and the table.
const COLOURS = {
    journey: '#3b82f6',       // blue-500
    active_static: '#f59e0b', // amber-500
    stationary: '#71717a',    // zinc-500
    data_gap: '#ef4444',      // red-500
};

// - Computed ----------------------------------------------------------

const latLng = (l: ReportLocation) => ({ lat: l.latitude, lng: l.longitude });

// - Methods -----------------------------------------------------------

function isSelected(id: string): boolean {
    return props.selectedSegmentId === id;
}

function journeyLine(segment: JourneySegment) {
    const selected = isSelected(segment.id);

    return {
        path: segment.points.map(p => ({ lat: p.latitude, lng: p.longitude })),
        strokeColor: COLOURS.journey,
        strokeOpacity: selected ? 1 : 0.75,
        strokeWeight: selected ? 7 : 4,
        zIndex: selected ? 10 : 1,
        clickable: true,
    };
}

function gapPath(segment: DataGapSegment) {
    return segment.previousLocation && segment.nextLocation;
}

function gapLine(segment: DataGapSegment) {
    const selected = isSelected(segment.id);

    // strokeOpacity 0 + repeated dot icons = a dashed line. This is deliberate:
    // it must not look like a route that was actually travelled.
    return {
        path: [latLng(segment.previousLocation!), latLng(segment.nextLocation!)],
        strokeOpacity: 0,
        icons: [{
            icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: selected ? 1 : 0.7,
                strokeColor: COLOURS.data_gap,
                strokeWeight: selected ? 4 : 2,
                scale: 3,
            },
            offset: '0',
            repeat: '14px',
        }],
        zIndex: selected ? 10 : 1,
        clickable: true,
    };
}

/** Sightings joined by a dashed line — a route we do not know (§41.5). */
function sightingsLine() {
    return {
        path: props.observations.map(o => latLng(o.location)),
        strokeOpacity: 0,
        icons: [{
            icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 0.7,
                strokeColor: COLOURS.data_gap,
                strokeWeight: 2,
                scale: 3,
            },
            offset: '0',
            repeat: '14px',
        }],
        zIndex: 1,
    };
}

function markerFor(location: ReportLocation, kind: string, title: string) {
    const fill = {
        start: COLOURS.journey,
        end: COLOURS.journey,
        active_static: COLOURS.active_static,
        stationary: COLOURS.stationary,
        observation: COLOURS.journey,
    }[kind] ?? COLOURS.stationary;

    return {
        position: latLng(location),
        title,
        icon: {
            path: 0, // google.maps.SymbolPath.CIRCLE
            scale: kind === 'active_static' ? 9 : 7,
            fillColor: fill,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
        },
    };
}

/**
 * Direction of travel at a point, computed from the surrounding fixes.
 *
 * The device's own `heading` is not used: it depends on how the tracker was
 * mounted and is frequently wrong. The course between consecutive positions is
 * what actually happened.
 */
function courseAt(point: ReportPoint): number | null {
    const segment = props.segments.find(
        s => 'points' in s && s.points.some(p => p.id === point.id)
    );
    if (!segment || !('points' in segment)) return null;

    const points = segment.points;
    const i = points.findIndex(p => p.id === point.id);

    // Prefer the leg into this point; for the first fix, the leg out of it.
    const previous = points[i - 1];
    if (previous) {
        const course = bearingBetween(previous, point);
        if (course !== null) return course;
    }

    const next = points[i + 1];
    if (next) return bearingBetween(point, next);

    return null;
}

// The live map's vehicle arrow (MarkerVehicle.vue), recentred on the origin so
// Google can rotate it: its `M 20 5 L 33 34 L 20 29 L 7 34 Z` in a 40x40 box
// becomes this once 20,20 is subtracted. Tip at negative y = north at rotation
// 0, so `rotation: course` means what it says — unlike SymbolPath's built-in
// FORWARD_CLOSED_ARROW, which is oriented for polylines and points backwards.
const ARROW_PATH = 'M 0,-15 L 13,14 L 0,9 L -13,14 Z';

// Matches DEFAULT_PALETTE.activeFill / activeLine on the live map.
const ARROW_FILL = '#3754fa';
const ARROW_LINE = '#ffffff';

/**
 * The asset at a single moment, styled like the live map's vehicle marker: an
 * arrow pointing the way it was travelling, or a dot when there is no direction
 * to show (a stationary fix, or a lone point) rather than an arrow aimed north
 * by default. Mirrors MarkerVehicle.vue's moving/stationary split.
 */
function pointMarker(point: ReportPoint) {
    const course = courseAt(point);

    return {
        position: { lat: point.latitude, lng: point.longitude },
        title: `${formatTime(point.timestamp, props.timezone)} · ${formatSpeed(point.speedKph)}`,
        zIndex: 20,
        icon: {
            path: course === null ? 0 : ARROW_PATH, // 0 = CIRCLE
            scale: course === null ? 9 : 1.1,       // the arrow path is ~29 units tall
            rotation: course ?? 0,
            fillColor: ARROW_FILL,
            fillOpacity: 0.9,
            strokeColor: ARROW_LINE,
            strokeWeight: 1.2,
        },
    };
}

/** null is not false — an unknown input must not read as "Off" (§41.4). */
function boolLabel(value: boolean | null): string {
    if (value === null) return '—';
    return value ? 'On' : 'Off';
}

function activeStaticTitle(segment: ActiveStaticSegment): string {
    const source = segment.activitySource === 'unknown'
        ? ''
        : ` · ${segment.activitySource.toUpperCase()}`;

    return `Active Stationary · ${formatDuration(segment.durationSeconds)}${source}`;
}

/** Every coordinate a segment touches. */
function coordsOf(segment: ActivitySegment) {
    if ('points' in segment) {
        return segment.points.map(p => ({ lat: p.latitude, lng: p.longitude }));
    }

    return [segment.previousLocation, segment.nextLocation]
        .filter((l): l is ReportLocation => !!l)
        .map(latLng);
}

function fitToCoords(coords: { lat: number; lng: number }[]) {
    const map = mapRef.value?.map;
    const api = mapRef.value?.api;
    if (!map || !api || !coords.length) return;

    const bounds = new api.LatLngBounds();
    for (const coord of coords) bounds.extend(coord);

    map.fitBounds(bounds, 48);

    // A single stationary point or sighting would otherwise zoom to street level.
    if (map.getZoom() > 17) map.setZoom(17);
}

function fitTo(segments: ActivitySegment[]) {
    fitToCoords(segments.flatMap(coordsOf));
}

/** Frame the whole report rather than guessing a centre. */
function fitToReport() {
    fitToCoords([
        ...props.segments.flatMap(coordsOf),
        ...props.observations.map(o => latLng(o.location)),
    ]);
}

// - Watch -------------------------------------------------------------

// The map instance and the report can arrive in either order.
watch(
    () => [mapRef.value?.ready, props.segments, props.observations] as const,
    ([ready]) => {
        if (ready) fitToReport();
    },
    { immediate: true, deep: true }
);

// Stepping through telemetry rows pans rather than refits — keeping the zoom
// steady so you can follow the vehicle along the route.
watch(
    () => props.selectedPoint,
    (point) => {
        const map = mapRef.value?.map;
        if (!map || !point) return;

        map.panTo({ lat: point.latitude, lng: point.longitude });
    }
);

// Selecting should take you to it — highlighting alone is no use if it's off
// screen. Deselecting reframes the whole report.
watch(
    () => props.selectedSegmentId,
    (id) => {
        if (!mapRef.value?.ready) return;

        if (!id) return fitToReport();

        const segment = props.segments.find(s => s.id === id);
        if (segment) return fitTo([segment]);

        const observation = props.observations.find(o => o.id === id);
        if (observation) return fitToCoords([latLng(observation.location)]);

        fitToReport();
    }
);
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.rmap {
    position: relative;
    height: 28rem;
    border: 1px solid var(--color-zinc-200);
    border-radius: var(--radius-md);
    overflow: hidden;

    &__loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--color-text-2);
        font-family: var(--font-display);
        font-size: .9rem;
    }
}

// Detail card for the pinned point, in the map's bottom-left corner.
.rpin {
    position: absolute;
    left: .75rem;
    bottom: .75rem;
    z-index: 2;
    padding: .6rem .75rem;
    background: var(--color-bg-li);
    border: 1px solid var(--color-zinc-300);
    border-radius: var(--radius-md);
    box-shadow: 0 2px 8px rgba(0, 0, 0, .18);
    white-space: nowrap;
    pointer-events: none;

    &__time {
        margin-bottom: .3rem;
        font-family: var(--font-display);
        font-size: .85rem;
        font-weight: 600;
        color: var(--color-text-1);
    }

    &__rows {
        display: grid;
        grid-template-columns: auto auto;
        gap: .1rem .6rem;
    }

    &__label {
        font-family: var(--font-display);
        font-size: .7rem;
        text-transform: uppercase;
        color: var(--color-text-2);
    }

    &__value {
        font-family: var(--font-mono);
        font-size: .75rem;
        color: var(--color-text-1);
        text-align: right;
    }
}

</style>
