<template>
    <div class="vsearch" :class="[`vsearch--${size}`]" >

        <svg class="vsearch__icon">
            <use xlink:href="@/ui/svg/sprite.svg#icon-search" />
        </svg>

        <input ref="inputEl" class="vsearch__input" type="text" :value="inputValue" :placeholder="placeholder"
            :aria-label="ariaLabel || placeholder || 'Search'" :autofocus="autofocus" @input="onInput"
            @keydown.escape="clear" />

        <!-- clear button -->
        <button v-if="clearable && inputValue" class="vsearch__clear" type="button" aria-label="Clear search"
            @click="clear">
            <svg class="vsearch__clear-icon" aria-hidden="true">
                <use xlink:href="@/ui/svg/sprite.svg#icon-close" />
            </svg>
        </button>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

/* ---------------------------------------
   Props (with defaults) & Emits
--------------------------------------- */
const props = withDefaults(defineProps<{
    modelValue: string;
    placeholder?: string;
    ariaLabel?: string;
    spritePath?: string;     // path to your svg sprite
    clearable?: boolean;
    autofocus?: boolean;
    size?: 'sm' | 'md' | 'lg';
    debounce?: number;       // ms; 0 = no debounce
}>(), {
    modelValue: '',
    spritePath: '@/ui/svg/sprite.svg',
    clearable: true,
    autofocus: false,
    size: 'md',
    debounce: 0,
    placeholder: 'Search…',
});

const emit = defineEmits<{
    (e: 'update:modelValue', v: string): void;
    (e: 'input', v: string): void; // fired after debounce too
}>();

/* ---------------------------------------
   Refs & Local State
--------------------------------------- */
const inputEl = ref<HTMLInputElement | null>(null);
const inputValue = ref(props.modelValue);
let timeoutId: number | undefined;

/* ---------------------------------------
   Sync external v-model -> local state
--------------------------------------- */
watch(() => props.modelValue, (v) => {
    if (v !== inputValue.value) inputValue.value = v;
});

/* ---------------------------------------
   Emit helpers
--------------------------------------- */
function flush(v: string) {
    emit('update:modelValue', v);
    emit('input', v);
}

/* ---------------------------------------
   Handlers
--------------------------------------- */
function onInput(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    inputValue.value = v;

    // Debounce if requested
    if (!props.debounce) {
        flush(v);
    } else {
        if (timeoutId) window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => flush(v), props.debounce);
    }
}

function clear() {
    if (!inputValue.value) return;
    inputValue.value = '';
    if (timeoutId) window.clearTimeout(timeoutId);
    flush('');
    inputEl.value?.focus(); // keep focus for quick re-typing
}

/* ---------------------------------------
   Lifecycle
--------------------------------------- */
onMounted(() => {
    if (props.autofocus) inputEl.value?.focus();
});

onBeforeUnmount(() => {
    if (timeoutId) window.clearTimeout(timeoutId);
});

/* ---------------------------------------
   Public methods (optional)
--------------------------------------- */
function focus() { inputEl.value?.focus(); }
defineExpose({ focus, clear });
</script>


<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
@use "../index.scss";

.vsearch {
    position: relative;
    width: 100%;
    font-family: var(--font-primary);
    

    &__icon {
        position: absolute;
        left: var(--space-2, .5rem);
        top: 50%;
        transform: translateY(-50%);
        width: 1rem;
        height: 1rem;
        color: var(--color-zinc-600);
        pointer-events: none;

    }

    &__input {
        width: 100%;
        height: 2rem;
        font-size: .9rem;
        padding: .3rem .5rem;
        padding-left: 2rem;
        font-family: var(--font-primary);
        /* leaves space for icon */
        color: var(--color-text-1);
        background: var(--color-bg-hi);
        border: 1px solid var(--color-zinc-300);
        border-radius: var(--radius-md, 6px);
        outline: none;
        transition: border-color .15s, box-shadow .15s;



        &:focus {
            border-color: var(--color-blue-500);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-blue-500) 20%, transparent);
        }
    }

    &__clear {
        position: absolute;
        right: var(--space-2, .5rem);
        top: 50%;
        transform: translateY(-50%);
        border: 0;
        background: transparent;
        padding: 0;
        cursor: pointer;
        color: var(--color-text-2);
        display: inline-flex;
        align-items: center;
        justify-content: center;

        &:hover {
            color: var(--color-text-1);
        }
    }

    &__clear-icon {
        width: 1rem;
        height: 1rem;
        fill: currentColor;
    }

    /* sizes */
    &--sm .vsearch__input {
        padding: .25rem .5rem;
        padding-left: 1.75rem;
        font-size: .85rem;
    }

    &--lg .vsearch__input {
        padding: .5rem .75rem;
        padding-left: 2.25rem;
        font-size: 1rem;
    }
}
</style>
