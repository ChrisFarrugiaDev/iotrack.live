<template>
    <Teleport to="body">
        <transition name="vmodal-fade">
            <div v-if="modelValue" class="v-ui vmodal__overlay" @click.self="onOverlayClick">
                <section class="vmodal" :class="`vmodal--${props.size}`">

                    <header v-if="title" class="vmodal__header">
                        <span class="vmodal__title">{{ title }}</span>
                        <button class="vmodal__close" @click="close" aria-label="Close">&times;</button>
                    </header>

                    <div class="vmodal__body">
                        <slot />
                    </div>

                    <footer v-if="$slots.footer" class="vmodal__footer">
                        <slot name="footer" />
                    </footer>

                </section>
            </div>
        </transition>
    </Teleport>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, nextTick, ref } from 'vue';

const props = withDefaults(defineProps<{
    modelValue: boolean;
    title?: string;
    closeOnEsc?: boolean;
    closeOnOverlay?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}>(), {
    closeOnEsc: true,
    closeOnOverlay: true,
    size: 'sm',
});

const emit = defineEmits<{
    (e: 'update:modelValue', val: boolean): void;
    (e: 'close'): void;
}>();

function close() {
    emit('update:modelValue', false);
    emit('close');
}

function onOverlayClick() {
    if (props.closeOnOverlay) close();
}

function handleEsc(e: KeyboardEvent) {
    if (e.key === 'Escape' && props.modelValue && props.closeOnEsc) {
        close();
    }
}

/* ---- Scroll lock on <html> while open ---- */
function lockScroll(lock: boolean) {
    const html = document.documentElement;
    if (lock) {
        // Save previous overflow so we can restore exactly
        html.setAttribute('data-prev-overflow', getComputedStyle(html).overflow);
        html.style.overflow = 'hidden';
    } else {
        const prev = html.getAttribute('data-prev-overflow') || '';
        html.style.overflow = prev as any;
        html.removeAttribute('data-prev-overflow');
    }
}

const panelRef = ref<HTMLElement | null>(null);

watch(() => props.modelValue, async (open) => {
    if (open) {
        lockScroll(true);
        await nextTick();
        panelRef.value?.focus();
    } else {
        lockScroll(false);
    }
}, { immediate: true });

onMounted(() => {
    window.addEventListener('keydown', handleEsc);
});
onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleEsc);
    lockScroll(false);
});
</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
.vue-custom-select {
     --vs-min-height: 4rem;
    --vs-padding: 1.9rem 0.5rem 0.5rem 0.5rem;
    --vs-background-color: var(--color-zinc-100);
    --vs-text-color: var(--color-text-1);
    --vs-border: 1px solid var(--color-zinc-300);
    --vs-border-radius: var(--radius-md, 0.375rem);
    --vs-font-weight: 300;
    --vs-font-size: 1rem;
    --vs-font-family: var(--font-action);
    --vs-outline-width: 0;
    --vs-outline-color: none;
    --vs-outline-color: var(--color-blue-500);
    --vs-menu-z-index: 2000;
    --vs-option-selected-background-color: var(--color-blue-400);
    --vs-option-disabled-background-color: var(--color-zinc-200);
    --vs-option-focused-text-color: var(--color-text-1);
    --vs-option-focused-background-color: var(--color-blue-100);
    --vs-option-hover-background-color: var(--color-blue-100);
    --vs-option-background-color: var(--color-white);
    --vs-option-text-color: var(--color-text-1);
    --vs-option-selected-text-color: var(--color-text-1);
    --vs-option-hover-text-color: var(--color-text-1);
}

.vmodal {
    background: var(--color-white, #fff);
    border-radius: var(--radius-md, 6px);
    max-width: 28rem;
    width: 100%;
    box-shadow: 0 6px 36px 0 rgba(0, 0, 0, 0.15);
    overflow: hidden;
    animation: vmodal-popin 0.15s;
    display: flex;
    flex-direction: column;

      /* size caps – account for overlay padding top & bottom (2rem + 2rem) */
  max-height: calc(100vh - 4rem);
  max-height: calc(100svh - 4rem); /* modern viewport units */

    &--xs { max-width: 20rem; } 
    &--sm { max-width: 36rem; } 
    &--md { max-width: 52rem; } 
    &--lg { max-width: 68rem; } 
    &--xl { max-width: 90rem; } 
    


    &__overlay {
        position: fixed;
        z-index: 50;
        inset: 0;
        background: rgba(0, 0, 0, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: saturate(120%) blur(1px);
        /* your margins become overlay padding */
        /* top, right, bottom, left */
        padding: 2rem 2rem 2rem 6rem;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem 1.5rem 0.5rem 1.5rem;
        color: var(--color-text-1);
        border-bottom: 1px solid var(--color-zinc-200);
        font-family: var(--font-primary, inherit);
        min-height: 3rem;
        position: relative;
    }

    &__title {
        font-weight: 600;
        font-size: 1.1rem;
    }

    &__close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.8rem;
        color: var(--color-zinc-400, #888);
        cursor: pointer;
        line-height: 1;
        &:hover {
             color: var(--color-zinc-600, #888);
        }
    }

    &__body {
        padding: 1.5rem;
        @extend %v-custom-scrollbar;
        z-index: 6000;
        font-family: var(--font-primary);
    }

    &__footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--color-zinc-200);
        background: var(--color-zinc-100, #f8f8f8);
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        min-height: 4rem;
    }
}


/* Fade transition */
.vmodal-fade-enter-active,
.vmodal-fade-leave-active {
    transition: opacity 0.13s;
}

.vmodal-fade-enter-from,
.vmodal-fade-leave-to {
    opacity: 0;
}

@keyframes vmodal-popin {
    from {
        transform: scale(0.97);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
