<template>
    <Vview pad="0">
        <template #header>
            <div class="vheading--2">Activity Report</div>
            <TheFlashMessage></TheFlashMessage>
        </template>

        <!-- Layout follows design doc §6: filters → summary → map → table -->
        <div class="report">

            <section class="report__filters">
                <div class="report__placeholder">Filters — asset, date range, generate (Phase C)</div>
            </section>

            <section class="report__summary">
                <div class="report__placeholder">Summary cards (Phase D)</div>
            </section>

            <section class="report__map">
                <div class="report__placeholder">Map (Phase F)</div>
            </section>

            <section class="report__table">
                <div class="report__placeholder">Activity table (Phase E)</div>
            </section>

        </div>
    </Vview>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { Vview } from '@/ui';
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';
import { onBeforeUnmount } from 'vue';
import { useActivityReportStore } from '@/stores/activityReportStore';

// - Store -------------------------------------------------------------

const activityReportStore = useActivityReportStore();

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

    &__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 6rem;
        border: 1px dashed var(--color-zinc-300);
        border-radius: var(--radius-md);
        color: var(--color-text-2);
        font-family: var(--font-display);
        font-size: .9rem;
    }

    &__map .report__placeholder {
        min-height: 20rem;
    }
}
</style>
