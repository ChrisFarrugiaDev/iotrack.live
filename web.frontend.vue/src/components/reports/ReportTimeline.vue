<template>
    <div class="rtimeline">

        <p class="rtimeline__note">
            This tracker reports infrequently, so the report lists where it was
            seen. Departure times, routes and stops between sightings are unknown.
        </p>

        <table class="rtimeline__table">
            <thead>
                <tr>
                    <th class="rtimeline__th">Seen at</th>
                    <th class="rtimeline__th">Position</th>
                    <th class="rtimeline__th">Moved</th>
                    <th class="rtimeline__th rtimeline__th--num">Distance from previous</th>
                    <th class="rtimeline__th rtimeline__th--num">Battery</th>
                </tr>
            </thead>

            <tbody>
                <tr
                    v-for="observation in observations"
                    :key="observation.id"
                    class="rtimeline__row"
                    :data-observation-id="observation.id"
                    :class="{ 'rtimeline__row--selected': observation.id === selectedSegmentId }"
                    @click="emit('select', observation.id)"
                >
                    <td class="rtimeline__cell">
                        {{ formatDateTime(observation.timestamp, timezone) }}
                    </td>

                    <td class="rtimeline__cell">
                        {{ formatCoords(observation.location.latitude, observation.location.longitude) }}
                    </td>

                    <td class="rtimeline__cell">
                        <span
                            class="rtimeline__badge"
                            :class="observation.changedPositionSincePrevious
                                ? 'rtimeline__badge--moved'
                                : 'rtimeline__badge--same'"
                        >
                            {{ observation.changedPositionSincePrevious ? 'Moved' : 'Same place' }}
                        </span>
                    </td>

                    <!-- Straight-line, not a travelled distance — the route is unknown. -->
                    <td class="rtimeline__cell rtimeline__cell--num">
                        <template v-if="observation.distanceFromPreviousMeters">
                            {{ formatDistance(observation.distanceFromPreviousMeters) }}
                            <span class="rtimeline__hint" title="Straight-line distance between sightings">*</span>
                        </template>
                        <span v-else class="rtimeline__na">—</span>
                    </td>

                    <td class="rtimeline__cell rtimeline__cell--num">
                        {{ observation.batteryPercent != null ? `${observation.batteryPercent}%` : '—' }}
                    </td>
                </tr>
            </tbody>
        </table>

        <p class="rtimeline__footnote">* Straight-line distance between sightings, not distance travelled.</p>

    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { nextTick, watch } from 'vue';
import type { TimelineObservation } from '@/types/activity-report.type';
import { formatCoords, formatDateTime, formatDistance } from '@/utils/report.utils';

// - Props & Emits -----------------------------------------------------

const props = defineProps<{
    observations: TimelineObservation[];
    timezone: string;
    selectedSegmentId: string | null;
}>();

const emit = defineEmits<{
    (e: 'select', id: string): void
}>();

// - Watch -------------------------------------------------------------

watch(
    () => props.selectedSegmentId,
    async (id) => {
        if (!id) return;

        await nextTick();

        document
            .querySelector(`[data-observation-id="${id}"]`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
);
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.rtimeline {
    background-color: var(--color-bg-hi);
    border: 1px solid var(--color-zinc-200);
    border-radius: var(--radius-md);
    overflow: hidden;

    &__note {
        padding: .75rem 1rem;
        margin: 0;
        background: var(--color-bg-li);
        border-bottom: 1px solid var(--color-zinc-200);
        font-family: var(--font-display);
        font-size: .8rem;
        color: var(--color-text-2);
    }

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
    }

    &__row {
        cursor: pointer;

        &:hover { background-color: var(--color-zinc-100); }
        &--selected { background-color: var(--color-blue-100); }
    }

    &__cell {
        padding: .55rem .75rem;
        border-bottom: 1px solid var(--color-zinc-200);
        white-space: nowrap;

        &--num { text-align: right; font-family: var(--font-mono); }
    }

    &__badge {
        display: inline-block;
        padding: .15rem .5rem;
        border-radius: 999px;
        font-family: var(--font-display);
        font-size: .75rem;
        font-weight: 500;

        &--moved { background: var(--color-blue-100); color: var(--color-blue-700); }
        &--same  { background: var(--color-zinc-100); color: var(--color-zinc-700); }
    }

    &__na { color: var(--color-zinc-400); }

    &__hint {
        color: var(--color-zinc-400);
        cursor: help;
    }

    &__footnote {
        padding: .5rem 1rem;
        margin: 0;
        font-family: var(--font-display);
        font-size: .75rem;
        color: var(--color-text-2);
    }
}
</style>
