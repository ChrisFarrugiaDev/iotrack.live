<template>
    <main class="vview v-ui" :style="rootStyle">
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
    pad: '4rem 1rem',
    inset: '3.75rem 2rem 3.75rem 6rem',
    bordered: true,
    elevated: false,
    background: 'var(--color-zinc-100)',
    contentBg: 'var(--color-white)',
});

const rootStyle = computed(() => ({
    background: props.background,
    padding: props.inset,
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
}

.vview__section {
    margin-inline: auto;
    width: 100%;
    border-radius: var(--radius-md, 6px);
    overflow: visible;

    /* modifiers */
    &--bordered {
        border: 1px solid var(--color-zinc-200);
    }

    &--elevated {
        box-shadow: 0 8px 24px rgba(0, 0, 0, .06);
    }
}
/*
  --color-zinc-50:  #09090b;
  --color-zinc-100: #18181b;
  --color-zinc-200: #27272a;
  --color-zinc-300: #3f3f46;
  --color-zinc-400: #52525b;
  --color-zinc-500: #71717a;
  --color-zinc-600: #a1a1aa;
  --color-zinc-700: #d4d4d8;
  --color-zinc-800: #e4e4e7;
  --color-zinc-900: #f4f4f5;
  --color-zinc-950: #fafafa;

*/
</style>
