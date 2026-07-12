<template>
    <Vview pad="0">
        <template #header>
            <div class="vheading--2">Activity Report</div>
            <TheFlashMessage></TheFlashMessage>
        </template>

        <!-- Layout follows design doc §6: filters → summary → map → table -->
        <div class="report">

            <section class="report__filters">
                <ReportFilters></ReportFilters>
            </section>

            <!-- States ---------------------------------------------- -->

            <p v-if="error" class="report__state report__state--error">{{ error }}</p>

            <p v-else-if="loading" class="report__state">Generating report…</p>

            <p v-else-if="!hasReport" class="report__state">
                Choose an asset and a date range, then generate a report.
            </p>

            <p v-else-if="isEmpty" class="report__state">
                No telemetry was found for the selected period.
            </p>

            <!-- Report ---------------------------------------------- -->

            <template v-else>
                <section v-if="subject && report" class="report__subject">
                    <span class="report__subject-name">{{ subject.assetName }}</span>
                    <span class="report__subject-meta">
                        {{ formatDateTime(report.report.from, report.report.timezone) }}
                        —
                        {{ formatDateTime(report.report.to, report.report.timezone) }}
                        · {{ report.report.timezone }}
                    </span>
                </section>

                <section v-if="summary" class="report__summary">
                    <ReportSummary :summary="summary"></ReportSummary>
                </section>

                <section class="report__map">
                    <ReportMap
                        :segments="segments"
                        :selectedSegmentId="selectedSegmentId"
                        @select="activityReportStore.selectSegment($event)"
                    ></ReportMap>
                </section>

                <section v-if="report" class="report__table">
                    <ReportTable
                        :segments="segments"
                        :timezone="report.report.timezone"
                        :selectedSegmentId="selectedSegmentId"
                        @select="activityReportStore.selectSegment($event)"
                    ></ReportTable>
                </section>
            </template>

        </div>
    </Vview>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { Vview } from '@/ui';
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';
import ReportFilters from '@/components/reports/ReportFilters.vue';
import ReportSummary from '@/components/reports/ReportSummary.vue';
import ReportMap from '@/components/reports/ReportMap.vue';
import ReportTable from '@/components/reports/ReportTable.vue';
import { formatDateTime } from '@/utils/report.utils';
import { storeToRefs } from 'pinia';
import { onBeforeUnmount } from 'vue';
import { useActivityReportStore } from '@/stores/activityReportStore';

// - Store -------------------------------------------------------------

const activityReportStore = useActivityReportStore();
const {
    loading, error, hasReport, isEmpty, selectedSegmentId,
    getReport: report, getSummary: summary, getSubject: subject,
    getSegments: segments,
} = storeToRefs(activityReportStore);

// - Hooks -------------------------------------------------------------

onBeforeUnmount(() => {
    activityReportStore.clear();
});
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.report {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-top: 2rem;

    &__subject {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: .75rem;
    }

    &__subject-name {
        font-family: var(--font-display);
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--color-text-1);
    }

    &__subject-meta {
        font-family: var(--font-mono);
        font-size: .85rem;
        color: var(--color-text-2);
    }

    &__state {
        padding: 3rem 0;
        text-align: center;
        color: var(--color-text-2);
        font-family: var(--font-display);
        font-size: .95rem;

        &--error {
            color: var(--color-orange-500);
        }
    }
}
</style>
