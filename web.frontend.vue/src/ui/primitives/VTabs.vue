<template>
    <div ref="vTabs" class="vtabs-mb" :class="{ 'vtabs-dt': isDesktop }">
        <div v-for="(value, key) in props.vtabsObjectData.tabs" :key="key" @click="emitActiveTab(key)"
        class="vtabs-mb__item" :class="{
            'vtabs-dt__item': isDesktop,
            'vtabs-mb__item--active': vtabsObjectData.activeTab === key && !isDesktop,
            'vtabs-dt__item--active': vtabsObjectData.activeTab === key && isDesktop
        }">
            {{ value }}
        </div>
        <p class="vtabs-mb__empty" :class="{ 'vtabs-dt__empty': isDesktop }"></p>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">

import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue';
    
// -- Types ------------------------------------------------------------

// type vTabsObjectData = {
//   tabs: Record<string, string>; // or more specific type if needed
//   activeTab: string;
// }

// -- Emits ------------------------------------------------------------

const emit = defineEmits<{
  (e: 'setActiveTab', tab: string): void;
}>();

// - Props -------------------------------------------------------------


const props = withDefaults(defineProps<{

    vtabsObjectData: {
        tabs: Record<string, string>;
        activeTab: string;
    };

    isDisabled?: boolean;

    layoutBreakpoint?: number;

}>(), {
    isDisabled: false,
    layoutBreakpoint: 600
});

// -- Data -------------------------------------------------------------

const vTabs = ref<HTMLElement | null>(null);
const vtabsWidth = ref(700);

// -- Computed ---------------------------------------------------------

const isDesktop = computed(() => vtabsWidth.value >= (props.layoutBreakpoint ?? 600));

// -- Methods for Responsiveness and Resizing --------------------------

// Updates the vtabsWidth ref with the current width of the vtabs container element
function updateWidth () {
    // Check if vTabs (DOM element) is mounted and available
    if (vTabs.value) {

        // Set vtabsWidth to the current width (in pixels) of the element
        vtabsWidth.value = vTabs.value.offsetWidth;
    }
};

// Sets up a ResizeObserver to watch for changes in vTabs element's size
function setupResizeObserver() {

    // Create a new ResizeObserver that will run the callback whenever the element is resized
    const resizeObserver = new ResizeObserver(() => {

        // Use requestAnimationFrame for smoother updates in the next frame
        requestAnimationFrame(() => {
            // Update vtabsWidth when a resize is detected
            updateWidth(); 
        });
    });

    // Start observing the vTabs element for size changes, if it's available
    if (vTabs.value) {
        resizeObserver.observe(vTabs.value);
    }

    // When the component is unmounted (destroyed), stop the observer to prevent memory leaks
    onUnmounted(() => {
        resizeObserver.disconnect();
    });
};

// -- Tab Handler ------------------------------------------------------

function emitActiveTab(tab: string) {
  if (props.isDisabled) return;
  emit('setActiveTab', tab);
}

// -- Hooks ------------------------------------------------------------

onMounted(() => {
    updateWidth();
    setupResizeObserver();
});

</script>

<!-- --------------------------------------------------------------- -->


<style lang="scss" scoped>
.vtabs-mb,
.vtabs-dt {
    display: flex;
    flex-direction: column;
    font-size: 1.1rem;
}

.vtabs-mb {
    &__empty {
        display: none;
    }

    &__item {
        cursor: pointer;
        font-family: var(--font-display);
        color: var(--color-zinc-400);
        font-weight: 400;
        padding: 2px 1rem;
        border: 1px solid var(--color-zinc-400);
        text-wrap: nowrap;

        &:not(:nth-last-child(2)) {
            border-bottom: none;
        }

        &:hover {
            color: var(--color-text-2);
            background-color: var(--color-blue-200);
            border-color: var(--color-text-2);

            &+.vtabs-mb__item {
                border-top: 1px solid var(--color-text-2);
            }
        }

        &--active {
            color: var(--color-white);
            background-color: var(--color-zinc-400);
            border-color: var(--color-zinc-400);
        }
    }
}

.vtabs-dt {
    flex-direction: row;

    &__empty {
        display: block;
        border-bottom: 1px solid var(--color-zinc-400) !important;
        flex: 1;
    }

    &__item {
        cursor: pointer;
        font-family: var(--font-display);
        color: var(--color-zinc-400);
        font-weight: 400;
        padding: 2px 0.5rem;
        min-width: 11rem;
        border: 1px solid var(--color-zinc-400);
        display: flex;
        justify-content: center;
        font-size: .9rem;
        text-wrap: nowrap;

        &:not(:nth-last-child(2)) {
            border-bottom: none;
        }

        &:not(:nth-last-child(2)) {
            border-bottom: 1px solid var(--color-zinc-400);
            border-right: none;
        }

        &:hover {
            color: var(--color-text-2);
            background-color: var(--color-blue-200);
            border-color: var(--color-text-2);
            border-bottom: 1px solid var(--color-text-2) !important;

            &+.vtabs-dt__item {
                border-top: 1px solid var(--color-zinc-400);
                border-left: 1px solid var(--color-text-2);
            }
        }

        &--active {
            color: var(--color-white);
            background-color: var(--color-zinc-400);
            border-color: var(--color-zinc-400);
        }
    }
}


</style>