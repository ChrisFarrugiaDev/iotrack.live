<template>
    <div id="the-reports-menu" class="menu m-1 v-ui" :data-theme="getSidebarTheme">

        <div class="menu__link menu__link--first" @click="goToView('reports.activity')">
            <div class="menu__text">Activity Report</div>
            <svg class="menu__icon">
                <use xlink:href="@/ui/svg/sprite.svg#icon-route-start"></use>
            </svg>
        </div>

        <!-- Future report types (see docs/iotrack_activity_report_design.md §1). -->
        <div class="menu__link menu__link--last menu__link--disabled">
            <div class="menu__text">More reports coming soon</div>
            <svg class="menu__icon">
                <use xlink:href="@/ui/svg/sprite.svg#icon-reports"></use>
            </svg>
        </div>

    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboardStore';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

// - Route -------------------------------------------------------------

const router = useRouter();

// - Store -------------------------------------------------------------

const dashboardStore = useDashboardStore();

// - Computed ----------------------------------------------------------

const getSidebarTheme = computed(() => {
    return dashboardStore.getTheme == 'light' ? 'light' : 'dark';
});

// - Methods -----------------------------------------------------------

function goToView(view: string) {
    dashboardStore.updateReportsMenuState(false);
    router.push({ name: view });
}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
.menu {
    box-shadow: $box-shadow-4;
    width: 14rem;
    background-color: transparent;

    &__link {
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        background-color: var(--color-bg-li);
        font-family: $font-display;
        gap: 1rem;
        width: 100%;
        padding: .5rem .8rem;
        color: var(--color-text-1);
        font-size: .9rem;
        transition: all .1s ease;
        border: 1px solid var(--color-zinc-300);

        &:not(&:last-child) {
            border-bottom: transparent;
        }

        &:hover {
            background-color: var(--color-zinc-700);
            color: var(--color-bg-li);
            border: 1px solid var(--color-zinc-700);
        }

        &--first {
            border-top-left-radius: $border-radius;
            border-top-right-radius: $border-radius;
        }

        &--last {
            border-bottom-left-radius: $border-radius;
            border-bottom-right-radius: $border-radius;
        }

        &--disabled {
            cursor: default;
            opacity: .5;

            &:hover {
                background-color: var(--color-bg-li);
                color: var(--color-text-1);
                border: 1px solid var(--color-zinc-300);
            }
        }
    }

    &__icon {
        width: 1.2rem;
        height: 1.2rem;
        fill: currentColor;
        stroke: currentColor;
    }
}
</style>
