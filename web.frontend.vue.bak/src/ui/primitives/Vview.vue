<template>
    <main class="vview" :style="rootStyle">
        <section class="vview__section" :class="sectionClass" :style="sectionStyle">
            <slot />
        </section>
    </main>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    maxWidth?: string;     // e.g. '90rem'
    pad?: string;          // e.g. '4rem 1rem'
    inset?: string;        // outer padding (top/right/bottom/left)
    bordered?: boolean;
    elevated?: boolean;
    background?: string;   // page bg (gray)
    contentBg?: string;    // section bg (white)
}>(), {
    maxWidth: '90rem',
    pad: '3rem 1rem',
    inset: '4.4rem 2rem 0rem 6rem',
    bordered: true,
    elevated: false,
    background: 'var(--color-bg-hi)',
    contentBg: 'var(--color-bg-li)',
});

const rootStyle = computed(() => ({
    background: props.background,
    // padding: props.inset, // This have been comment and is handled from the style block to have some screen response
}));

const sectionClass = computed(() => ({
    'vview__section--bordered': props.bordered,
    'vview__section--elevated': props.elevated,
}));

const sectionStyle = computed(() => ({
    maxWidth: props.maxWidth,
    padding: props.pad,
    background: props.contentBg,
}));
</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
@use "../index.scss";

.vview {
    width: 100%;
    min-height: 100%;
    padding: 4.4rem 2rem 0rem 6rem;

    @include respondHeight(688) {
        padding: 1.5rem 2rem 0rem 6rem;
    }
}

.vview__section {
    margin-inline: auto;
    width: 100%;
    border-radius: var(--radius-md, 500px);
    overflow: visible;

    /* modifiers */
    &--bordered {
        border: 1px solid var(--color-zinc-300);
    }

    &--elevated {
        box-shadow: 0 8px 24px rgba(0, 0, 0, .06);
    }
}


</style>
