<template>
    <div class="rmap">
        <GoogleMap
            v-if="apiKey"
            ref="mapRef"
            :api-key="apiKey"
            :center="fallbackCenter"
            :zoom="12"
            :mapId="'9e8ca8994cbac798'"
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
        </GoogleMap>

        <div v-else class="rmap__loading">Loading map…</div>
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
} from '@/types/activity-report.type';
import { formatDuration } from '@/utils/report.utils';

// - Props & Emits -----------------------------------------------------

const props = defineProps<{
    segments: ActivitySegment[];
    selectedSegmentId: string | null;
}>();

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

function markerFor(location: ReportLocation, kind: string, title: string) {
    const fill = {
        start: COLOURS.journey,
        end: COLOURS.journey,
        active_static: COLOURS.active_static,
        stationary: COLOURS.stationary,
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

/** Frame the whole report rather than guessing a centre. */
function fitToReport() {
    const map = mapRef.value?.map;
    const api = mapRef.value?.api;
    if (!map || !api) return;

    const bounds = new api.LatLngBounds();
    let hasPoint = false;

    for (const segment of props.segments) {
        if ('points' in segment) {
            for (const point of segment.points) {
                bounds.extend({ lat: point.latitude, lng: point.longitude });
                hasPoint = true;
            }
        } else {
            for (const location of [segment.previousLocation, segment.nextLocation]) {
                if (location) {
                    bounds.extend(latLng(location));
                    hasPoint = true;
                }
            }
        }
    }

    if (hasPoint) map.fitBounds(bounds, 48);
}

// - Watch -------------------------------------------------------------

// The map instance and the report can arrive in either order.
watch(
    () => [mapRef.value?.ready, props.segments] as const,
    ([ready]) => {
        if (ready) fitToReport();
    },
    { immediate: true, deep: true }
);
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.rmap {
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
</style>
