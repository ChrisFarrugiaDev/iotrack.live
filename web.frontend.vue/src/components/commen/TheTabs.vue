<template>
    <div ref="theTabs" class="tabs-mb" :class="{ 'tabs-dt': isDesktop }">
        <div v-for="(value, key) in props.tabsObjectData.tabs" :key="key" @click="emitActiveTab(key)"
        class="tabs-mb__item" :class="{
            'tabs-dt__item': isDesktop,
            'tabs-mb__item--active': tabsObjectData.activeTab === key && !isDesktop,
            'tabs-dt__item--active': tabsObjectData.activeTab === key && isDesktop
        }">
            {{ value }}
        </div>
        <p class="tabs-mb__empty" :class="{ 'tabs-dt__empty': isDesktop }"></p>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">

import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue';
    
// -- Types ------------------------------------------------------------

type TabsObjectData = {
  tabs: Record<string, string>; // or more specific type if needed
  activeTab: string;
}

// -- Emits ------------------------------------------------------------

const emit = defineEmits<{
  (e: 'setActiveTab', tab: string): void;
}>();

// - Props -------------------------------------------------------------


const props = withDefaults(defineProps<{

    tabsObjectData: {
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

const theTabs = ref<HTMLElement | null>(null);
const tabsWidth = ref(700);

// -- Computed ---------------------------------------------------------

const isDesktop = computed(() => tabsWidth.value >= (props.layoutBreakpoint ?? 600));

// -- Methods for Responsiveness and Resizing --------------------------

// Updates the tabsWidth ref with the current width of the tabs container element
function updateWidth () {
    // Check if theTabs (DOM element) is mounted and available
    if (theTabs.value) {

        // Set tabsWidth to the current width (in pixels) of the element
        tabsWidth.value = theTabs.value.offsetWidth;
    }
};

// Sets up a ResizeObserver to watch for changes in theTabs element's size
function setupResizeObserver() {

    // Create a new ResizeObserver that will run the callback whenever the element is resized
    const resizeObserver = new ResizeObserver(() => {

        // Use requestAnimationFrame for smoother updates in the next frame
        requestAnimationFrame(() => {
            // Update tabsWidth when a resize is detected
            updateWidth(); 
        });
    });

    // Start observing the theTabs element for size changes, if it's available
    if (theTabs.value) {
        resizeObserver.observe(theTabs.value);
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
.tabs-mb,
.tabs-dt {
    display: flex;
    flex-direction: column;
    font-size: 1.1rem;
}

.tabs-mb {
    &__empty {
        display: none;
    }

    &__item {
        cursor: pointer;
        font-family: $font-display;
        color: $col-zinc-400;
        font-weight: 400;
        padding: 2px 1rem;
        border: 1px solid $col-zinc-400;
        text-wrap: nowrap;

        &:not(:nth-last-child(2)) {
            border-bottom: none;
        }

        &:hover {
            color: $col-text-2;
            background-color: $col-blue-200;
            border-color: $col-text-2;

            &+.tabs-mb__item {
                border-top: 1px solid $col-text-2;
            }
        }

        &--active {
            color: $col-white;
            background-color: $col-zinc-400;
            border-color: $col-zinc-400;
        }
    }
}

.tabs-dt {
    flex-direction: row;

    &__empty {
        display: block;
        border-bottom: 1px solid $col-zinc-400 !important;
        flex: 1;
    }

    &__item {
        cursor: pointer;
        font-family: $font-display;
        color: $col-zinc-400;
        font-weight: 400;
        padding: 2px 0.5rem;
        min-width: 11rem;
        border: 1px solid $col-zinc-400;
        display: flex;
        justify-content: center;
        font-size: .9rem;
        text-wrap: nowrap;

        &:not(:nth-last-child(2)) {
            border-bottom: none;
        }

        &:not(:nth-last-child(2)) {
            border-bottom: 1px solid $col-zinc-400;
            border-right: none;
        }

        &:hover {
            color: $col-text-2;
            background-color: $col-blue-200;
            border-color: $col-text-2;
            border-bottom: 1px solid $col-text-2 !important;

            &+.tabs-dt__item {
                border-top: 1px solid $col-zinc-400;
                border-left: 1px solid $col-text-2;
            }
        }

        &--active {
            color: $col-white;
            background-color: $col-zinc-400;
            border-color: $col-zinc-400;
        }
    }
}
</style>