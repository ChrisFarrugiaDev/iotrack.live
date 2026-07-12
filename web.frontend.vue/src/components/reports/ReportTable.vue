<template>
    <div class="rtable">

        <table class="rtable__table">
            <thead>
                <tr>
                    <th class="rtable__th rtable__th--expand"></th>
                    <th class="rtable__th">Type</th>
                    <th class="rtable__th">Start</th>
                    <th class="rtable__th">End</th>
                    <th class="rtable__th rtable__th--num">Duration</th>
                    <th class="rtable__th rtable__th--num">Distance</th>
                    <th class="rtable__th">Details</th>
                </tr>
            </thead>

            <tbody>
                <template v-for="segment in segments" :key="segment.id">

                    <tr
                        class="rtable__row"
                        :data-segment-id="segment.id"
                        :class="[
                            `rtable__row--${segment.type}`,
                            { 'rtable__row--selected': segment.id === selectedSegmentId },
                        ]"
                        @click="select(segment)"
                    >
                        <!-- Expand: only segments that carry points -->
                        <td class="rtable__cell rtable__cell--expand">
                            <button
                                v-if="hasPoints(segment)"
                                type="button"
                                class="rtable__expand"
                                :class="{ 'rtable__expand--open': expandedId === segment.id }"
                                @click.stop="toggleExpanded(segment.id)"
                            >
                                <svg class="rtable__chevron">
                                    <use xlink:href="@/ui/svg/sprite.svg#icon-select-chevron"></use>
                                </svg>
                            </button>
                        </td>

                        <td class="rtable__cell">
                            <span class="rtable__badge" :class="`rtable__badge--${segment.type}`">
                                {{ segmentLabel(segment.type) }}
                            </span>
                        </td>

                        <!-- A segment clipped by the report window is partial, not wrong (§43) -->
                        <td class="rtable__cell">
                            {{ formatTime(segment.startAt, timezone) }}
                            <span v-if="segment.boundary?.startsBeforeReportRange" class="rtable__partial"
                                title="Started before the report period">…</span>
                        </td>

                        <td class="rtable__cell">
                            {{ formatTime(segment.endAt, timezone) }}
                            <span v-if="segment.boundary?.endsAfterReportRange" class="rtable__partial"
                                title="Still running after the report period">…</span>
                        </td>

                        <td class="rtable__cell rtable__cell--num">
                            {{ formatDuration(segment.durationSeconds) }}
                        </td>

                        <!-- Distance only means something for a journey (§26) -->
                        <td class="rtable__cell rtable__cell--num">
                            <template v-if="segment.type === 'journey'">
                                {{ formatDistance(segment.distanceMeters) }}
                            </template>
                            <span v-else class="rtable__na">—</span>
                        </td>

                        <td class="rtable__cell rtable__cell--details">
                            {{ details(segment) }}
                        </td>
                    </tr>

                    <!-- Detailed points (§27) -->
                    <tr v-if="expandedId === segment.id && hasPoints(segment)" class="rtable__detail-row">
                        <td class="rtable__cell" colspan="7">
                            <table class="rpoints">
                                <thead>
                                    <tr>
                                        <th class="rpoints__th">Time</th>
                                        <th class="rpoints__th">Position</th>
                                        <th class="rpoints__th rtable__th--num">Speed</th>
                                        <th class="rpoints__th">Ignition</th>
                                        <th class="rpoints__th">Activity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="point in pointsOf(segment)"
                                        :key="point.id"
                                        class="rpoints__row"
                                        :class="{ 'rpoints__row--selected': point.id === selectedPointId }"
                                        @click.stop="emit('select-point', point)"
                                    >
                                        <td class="rpoints__cell">{{ formatTime(point.timestamp, timezone) }}</td>
                                        <td class="rpoints__cell">{{ formatCoords(point.latitude, point.longitude) }}</td>
                                        <td class="rpoints__cell rtable__cell--num">{{ formatSpeed(point.speedKph) }}</td>
                                        <td class="rpoints__cell">{{ boolLabel(point.ignitionOn) }}</td>
                                        <td class="rpoints__cell">{{ boolLabel(point.activityOn) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                </template>
            </tbody>
        </table>

    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { ActivitySegment, ActivityState, ReportPoint } from '@/types/activity-report.type';
import {
    formatCoords,
    formatDistance,
    formatDuration,
    formatSpeed,
    formatTime,
} from '@/utils/report.utils';

// - Props & Emits -----------------------------------------------------

const props = defineProps<{
    segments: ActivitySegment[];
    timezone: string;
    selectedSegmentId: string | null;
    selectedPointId?: string | null;
}>();

const emit = defineEmits<{
    (e: 'select', id: string): void
    (e: 'select-point', point: ReportPoint): void
}>();

// - Data --------------------------------------------------------------

const expandedId = ref<string | null>(null);

// Internally active_static; "Active Stationary" in the UI (§8.2).
const LABELS: Record<ActivityState, string> = {
    journey: 'Journey',
    active_static: 'Active Stationary',
    stationary: 'Stationary',
    data_gap: 'Data Gap',
};

// - Methods -----------------------------------------------------------

function segmentLabel(type: ActivityState): string {
    return LABELS[type];
}

function hasPoints(segment: ActivitySegment): boolean {
    return 'points' in segment && segment.points.length > 0;
}

function pointsOf(segment: ActivitySegment): ReportPoint[] {
    return 'points' in segment ? segment.points : [];
}

function boolLabel(value: boolean | null): string {
    if (value === null) return '—'; // null is not false (§41.4)
    return value ? 'On' : 'Off';
}

/** Context-aware detail cell — never force an irrelevant value (§26). */
function details(segment: ActivitySegment): string {
    switch (segment.type) {
        case 'journey':
            return segment.maximumSpeedKph !== null
                ? `Max ${formatSpeed(segment.maximumSpeedKph)}`
                : '';

        case 'active_static':
            return segment.activitySource === 'unknown'
                ? 'Working'
                : `Working — ${segment.activitySource.toUpperCase()}`;

        case 'stationary':
            return 'Parked';

        case 'data_gap':
            return 'No data — route unknown';
    }
}

function toggleExpanded(id: string) {
    expandedId.value = expandedId.value === id ? null : id;
}

function select(segment: ActivitySegment) {
    emit('select', segment.id);
}

// - Watch -------------------------------------------------------------

// Selection can come from the map, so bring the row into view. Not while
// scrubbing though: the slider pins a point, and scrolling the page to the
// table would drag it out from under the cursor.
watch(
    () => props.selectedSegmentId,
    async (id) => {
        if (!id || props.selectedPointId) return;

        await nextTick();

        const row = document.querySelector(`[data-segment-id="${id}"]`);
        row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
);
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.rtable {
    background-color: var(--color-bg-hi);
    border: 1px solid var(--color-zinc-200);
    border-radius: var(--radius-md);
    overflow: hidden;

    &__table {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--font-primary);
        font-size: .9rem;
        color: var(--color-text-2);
    }

    &__th {
        padding: .6rem .75rem;
        text-align: left;
        font-family: var(--font-display);
        font-weight: 600;
        font-size: .8rem;
        color: var(--color-zinc-900);
        background: var(--color-bg-li);
        border-bottom: 1px solid var(--color-zinc-300);
        white-space: nowrap;

        &--num { text-align: right; }
        &--expand { width: 2.5rem; }
    }

    &__row {
        cursor: pointer;
        border-left: 4px solid transparent;
        transition: background-color .1s ease;

        // Same colour language as the summary cards and the map.
        &--journey       { border-left-color: var(--color-blue-500); }
        &--active_static { border-left-color: var(--color-amber-500); }
        &--stationary    { border-left-color: var(--color-zinc-500); }
        &--data_gap      { border-left-color: var(--color-red-500); }

        &:hover {
            background-color: var(--color-zinc-100);
        }

        &--selected {
            background-color: var(--color-blue-100);
        }
    }

    &__cell {
        padding: .55rem .75rem;
        border-bottom: 1px solid var(--color-zinc-200);
        white-space: nowrap;

        &--num { text-align: right; font-family: var(--font-mono); }
        &--details { color: var(--color-text-2); white-space: normal; }
        &--expand { padding-left: .5rem; padding-right: 0; }
    }

    &__na {
        color: var(--color-zinc-400);
    }

    &__partial {
        color: var(--color-zinc-400);
        cursor: help;
    }

    &__badge {
        display: inline-block;
        padding: .15rem .5rem;
        border-radius: 999px;
        font-family: var(--font-display);
        font-size: .75rem;
        font-weight: 500;
        white-space: nowrap;

        &--journey       { background: var(--color-blue-100);  color: var(--color-blue-700); }
        &--active_static { background: var(--color-amber-100); color: var(--color-amber-700); }
        &--stationary    { background: var(--color-zinc-100);  color: var(--color-zinc-700); }
        &--data_gap      { background: var(--color-red-100);   color: var(--color-red-700); }
    }

    &__expand {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        padding: 0;
        border: 0;
        background: none;
        cursor: pointer;
        color: var(--color-text-2);

        &--open .rtable__chevron { transform: rotate(180deg); }
    }

    &__chevron {
        width: 16px;
        height: 16px;
        fill: currentColor;
        transition: transform .15s ease;
    }

    &__detail-row {
        background: var(--color-bg-li);
    }
}

// Detailed telemetry points inside an expanded segment.
.rpoints {
    width: 100%;
    border-collapse: collapse;
    font-size: .8rem;

    &__th {
        padding: .35rem .5rem;
        text-align: left;
        font-family: var(--font-display);
        font-weight: 500;
        font-size: .7rem;
        text-transform: uppercase;
        color: var(--color-text-2);
    }

    &__cell {
        padding: .3rem .5rem;
        font-family: var(--font-mono);
        color: var(--color-text-1);
        white-space: nowrap;
    }

    &__row {
        cursor: pointer;

        &:nth-of-type(odd) {
            background: var(--color-bg-hi);
        }

        &:hover {
            background: var(--color-blue-100);
        }

        // Pinned on the map.
        &--selected,
        &--selected:nth-of-type(odd) {
            background: var(--color-blue-100);
            box-shadow: inset 3px 0 0 var(--color-blue-500);
        }
    }
}
</style>
