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

        <!-- Without this nobody knows amber means "working" and red means
             "we don't know what happened here". -->
        <ul v-if="apiKey" class="rlegend">
            <template v-if="observations.length">
                <li class="rlegend__item">
                    <span class="rlegend__swatch rlegend__swatch--observation"></span>Sighting
                </li>
                <li class="rlegend__item">
                    <span class="rlegend__swatch rlegend__swatch--data_gap"></span>Route between sightings unknown
                </li>
            </template>

            <template v-else>
                <li class="rlegend__item">
                    <span class="rlegend__swatch rlegend__swatch--journey"></span>Journey
                </li>
                <li class="rlegend__item">
                    <span class="rlegend__swatch rlegend__swatch--active_static"></span>Active Stationary
                </li>
                <li class="rlegend__item">
                    <span class="rlegend__swatch rlegend__swatch--stationary"></span>Stationary
                </li>
                <li class="rlegend__item">
                    <span class="rlegend__swatch rlegend__swatch--data_gap"></span>Data gap — route unknown
                </li>
            </template>
        </ul>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';

import { useSettingsStore } from '@/stores/settingsStore';
import type {
    ActiveStaticSegment,
    ActivitySegment,
    DataGapSegment,
    JourneySegment,
    ReportLocation,
    TimelineObservation,
} from '@/types/activity-report.type';
import { formatDateTime, formatDuration } from '@/utils/report.utils';

// - Props & Emits -----------------------------------------------------

const props = withDefaults(defineProps<{
    segments: ActivitySegment[];
    observations?: TimelineObservation[];
    timezone?: string;
    selectedSegmentId: string | null;
}>(), {
    observations: () => [],
    timezone: 'UTC',
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

.rlegend {
    position: absolute;
    left: .75rem;
    bottom: .75rem;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: .3rem;
    margin: 0;
    padding: .6rem .75rem;
    list-style: none;
    background: var(--color-bg-hi);
    border: 1px solid var(--color-zinc-300);
    border-radius: var(--radius-md);
    box-shadow: 0 1px 4px rgba(0, 0, 0, .12);

    &__item {
        display: flex;
        align-items: center;
        gap: .5rem;
        font-family: var(--font-display);
        font-size: .75rem;
        color: var(--color-text-1);
        white-space: nowrap;
    }

    &__swatch {
        width: 1rem;
        height: 3px;
        border-radius: 2px;

        &--journey       { background: #3b82f6; }
        &--stationary    { background: #71717a; }

        &--observation {
            width: .7rem;
            height: .7rem;
            border-radius: 50%;
            background: #3b82f6;
        }

        &--active_static {
            width: .7rem;
            height: .7rem;
            border-radius: 50%;
            background: #f59e0b;
        }

        // Dashed, exactly as it is drawn on the map.
        &--data_gap {
            height: 0;
            border-top: 3px dashed #ef4444;
            background: none;
        }
    }
}
</style>
