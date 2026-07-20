<template>
    <div class="date-field" ref="rootRef">
        <input
            :id="id"
            class="vform__input"
            :class="{ 'vform__input--error': error }"
            :value="displayValue"
            :disabled="disabled"
            readonly
            @click="toggle"
        />

        <Teleport to=".dashboard">
            <div
                v-if="isOpen"
                ref="panelRef"
                class="date-field__panel v-ui"
                :style="panelStyle"
            >
                <VDatePicker
                    :model-value="modelValue"
                    mode="dateTime"
                    is24hr
                    :min-date="minDate"
                    :max-date="maxDate"
                    @update:model-value="onSelect"
                />
            </div>
        </Teleport>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<!--
    v-calendar's own popover (used when `<VDatePicker>` gets a #default
    trigger slot) is `position: absolute` with no teleport option (v3.1.2).
    Nested three deep in Vview's `overflow: hidden` / `overflow-y: auto`
    ancestors, it renders clipped and — because its containing block sits
    outside the actual scrolling element — visibly detaches from the input
    on scroll. Same class of bug as the VueSelect dropdown (see
    ACTIVITY_REPORT_UI_ROADMAP.md gotchas), just not fixable with a
    `teleport` prop this time. Sidestepped here: no trigger slot is passed,
    so `<VDatePicker>` renders the bare calendar (no popover machinery of
    its own) inside a panel this component teleports and positions itself.
-->

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { onClickOutside } from '@vueuse/core';

const props = defineProps<{
    id: string;
    modelValue: Date;
    minDate?: Date;
    maxDate?: Date;
    disabled?: boolean;
    error?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [Date] }>();

const rootRef = ref<HTMLElement>();
const panelRef = ref<HTMLElement>();
const isOpen = ref(false);
const panelStyle = ref<Record<string, string>>({});

const displayValue = computed(() => {
    const d = props.modelValue;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
});

function updatePosition() {
    const rect = rootRef.value?.getBoundingClientRect();
    if (!rect) return;

    panelStyle.value = {
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
    };
}

// Closing on scroll (rather than tracking it) matches how a click-away
// dropdown is expected to behave, and avoids re-deriving position while a
// `position: fixed` panel can't itself track an ancestor's internal scroll.
function closeOnScroll() {
    isOpen.value = false;
}

function toggle() {
    if (props.disabled) return;
    isOpen.value ? close() : open();
}

async function open() {
    isOpen.value = true;
    await nextTick();
    updatePosition();

    // Deferred: focusing the (readonly) input can itself trigger a native
    // "scroll into view", which would otherwise fire the close-on-scroll
    // listener the instant it's attached and close the panel it just opened.
    setTimeout(() => {
        if (!isOpen.value) return;
        window.addEventListener('scroll', closeOnScroll, true);
        window.addEventListener('resize', closeOnScroll);
    }, 0);
}

function close() {
    isOpen.value = false;
    window.removeEventListener('scroll', closeOnScroll, true);
    window.removeEventListener('resize', closeOnScroll);
}

function onSelect(value: Date) {
    emit('update:modelValue', value);
}

onClickOutside(rootRef, close, { ignore: [panelRef] });

onBeforeUnmount(() => {
    window.removeEventListener('scroll', closeOnScroll, true);
    window.removeEventListener('resize', closeOnScroll);
});
</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
.date-field {
    height: 100%;
}

.date-field__panel {
    z-index: 2000;
    background: var(--color-bg-hi);
    border: 1px solid var(--color-zinc-300);
    border-radius: var(--radius-md, 0.375rem);
    box-shadow: 0 8px 24px rgba(0, 0, 0, .12);
}
</style>
