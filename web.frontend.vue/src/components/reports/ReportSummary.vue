<template>
    <div class="rsummary">

        <div class="rsummary__card">
            <div class="rsummary__label">Journeys</div>
            <div class="rsummary__value">{{ summary.journeyCount }}</div>
        </div>

        <div class="rsummary__card">
            <div class="rsummary__label">Distance</div>
            <div class="rsummary__value">{{ formatDistance(summary.totalDistanceMeters) }}</div>
        </div>

        <div class="rsummary__card rsummary__card--journey">
            <div class="rsummary__label">Moving</div>
            <div class="rsummary__value">{{ formatDuration(summary.movingSeconds) }}</div>
        </div>

        <div class="rsummary__card rsummary__card--active-static">
            <div class="rsummary__label">Active Stationary</div>
            <div class="rsummary__value">{{ formatDuration(summary.activeStaticSeconds) }}</div>
        </div>

        <div class="rsummary__card rsummary__card--stationary">
            <div class="rsummary__label">Stationary</div>
            <div class="rsummary__value">{{ formatDuration(summary.stationarySeconds) }}</div>
        </div>

        <div class="rsummary__card rsummary__card--data-gap">
            <div class="rsummary__label">Data Gap</div>
            <div class="rsummary__value">{{ formatDuration(summary.communicationGapSeconds) }}</div>
        </div>

    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import type { ActivityReportSummary } from '@/types/activity-report.type';
import { formatDistance, formatDuration } from '@/utils/report.utils';

defineProps<{
    summary: ActivityReportSummary;
}>();
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.rsummary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 1rem;

    &__card {
        padding: .9rem 1rem;
        background-color: var(--color-bg-hi);
        border: 1px solid var(--color-zinc-300);
        border-left: 4px solid var(--color-zinc-300);
        border-radius: var(--radius-md);

        // Colour-coded to match the segment types on the map and table.
        &--journey        { border-left-color: var(--color-blue-500); }
        &--active-static  { border-left-color: var(--color-amber-500); }
        &--stationary     { border-left-color: var(--color-zinc-500); }
        &--data-gap       { border-left-color: var(--color-red-500); }
    }

    &__label {
        font-family: var(--font-display);
        font-size: .75rem;
        font-weight: 500;
        text-transform: uppercase;
        color: var(--color-text-2);
    }

    &__value {
        margin-top: .35rem;
        font-family: var(--font-mono);
        font-size: 1.35rem;
        color: var(--color-text-1);
    }
}
</style>
