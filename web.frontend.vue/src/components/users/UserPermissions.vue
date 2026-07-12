<template>
    <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
        <div class="vform__group tree-field mb-7 w-full" style="height: fit-content;">
            <label class="vform__label" for="permissions">Permissions</label>
            <!-- TreeSelect (force re-render with :key to sync changes instantly) -->
            <Treeselect
                :key="treeKey"
                v-model="permissions"
                :multiple="true"
                :options="permissionsOptions"
                :disabled="confirmOn"
                :show-count="true"
                :disable-branch-nodes="true"
                :limit="10"
                :limit-text="limitText"
                placeholder=""
            />

            <!-- Sprite icons matching the standard select fields -->
            <div class="tree-field__icons">
                <svg
                    v-if="!confirmOn && permissions?.length"
                    class="tree-field__icon tree-field__icon--clear"
                    @mousedown.prevent.stop="clearPermissions"
                >
                    <use xlink:href="@/ui/svg/sprite.svg#icon-select-x"></use>
                </svg>
                <svg class="tree-field__icon tree-field__icon--arrow">
                    <use xlink:href="@/ui/svg/sprite.svg#icon-select-chevron"></use>
                </svg>
            </div>
        </div>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useAuthorizationStore } from '@/stores/authorizationStore';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import Treeselect from 'vue3-treeselect';
import 'vue3-treeselect/dist/vue3-treeselect.css';

// - Store -------------------------------------------------------------
const authorizationStore = useAuthorizationStore();
const { getGroupedPermissions } = storeToRefs(authorizationStore);

// - Props -------------------------------------------------------------
const props = defineProps<{
    confirmOn: boolean,    
    defaultPermissions?: number[],
}>();

// - Emits -------------------------------------------------------------

const emit = defineEmits<{
    (e: 'perm-changed', value: number[]): void
}>();



// - Data --------------------------------------------------------------

// Collapses selected chips beyond :limit into a single "and N more" tag.
function limitText(count: number) {
    return `and ${count} more`;
}

function clearPermissions() {
    permissions.value = [];
    treeKey.value++;
}

const permissions = ref<number[]>([]);
const permissionsOptions = ref<Record<string, any>[]>([]);
const treeKey = ref(1); // Used to force Treeselect re-render

// - Watch -------------------------------------------------------------

// Update options whenever store changes
watch(getGroupedPermissions, (grpPerms) => {
    permissionsOptions.value = grpPerms;
}, {
    deep: true,
    immediate: true,
});

// Update model & force Treeselect to re-render when defaultPermissions prop changes
watch(() => props.defaultPermissions, (p, oldP) => {
    
    if (p && JSON.stringify(p) !== JSON.stringify(oldP)) {
        permissions.value = p;
        treeKey.value++; // Bump key to force re-render (keeps UI in sync, no flicker)
    }
}, {
    immediate: true,
});


watch(permissions, (p, oldP) => {

    if (JSON.stringify(p) !== JSON.stringify(oldP)) {
        emit('perm-changed', p);
    }
});
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Sprite icons overlaid on the Treeselect so it matches the standard
// select fields. Treeselect exposes no slots for its own indicators, so
// they are hidden below and these are positioned in their place.
.tree-field {
    position: relative;
}

.tree-field__icons {
    position: absolute;
    top: 0;
    bottom: 0;
    right: .5rem;
    padding: 1.9rem 0 .5rem; // mirrors --vs-padding so icons sit low like the other fields
    display: flex;
    align-items: center;
    gap: 0;         // matches --vs-indicators-gap
    pointer-events: none; // clicks fall through to the control
    z-index: 5;
}

.tree-field__icon {
    // Same glyphs, size and fill vue3-select-component uses for its indicators.
    width: 20px;
    height: 20px;
    fill: currentColor;
    color: var(--color-text-1);

    &--clear {
        pointer-events: auto;
        cursor: pointer;
    }
}

// Hide Treeselect's own arrow and clear icons.
:deep(.vue-treeselect__control-arrow-container),
:deep(.vue-treeselect__x-container) {
    display: none;
}

:deep(.vue-treeselect) {
    min-height: 4rem;
    overflow: visible !important;
    font-size: 14px;
    width: 100%;
    font-family: var(--font-primary);
    color: var(--color-text-1);
    outline: none !important;
    transition: 0s all !important;
}

:deep(.vue-treeselect__control) {
    min-height: 4rem;
    height: fit-content;
    border: 1px solid var(--color-zinc-300);
    display: flex;
    align-items: center;
    color: var(--color-text-1);
    background-color: var(--color-bg-hi) !important;
    border-radius: 5px !important;
    outline: none !important;

    &:hover {
        border: 1px solid var(--color-zinc-300) !important;
    }
}

:deep(.vue-treeselect--focused:not(.vue-treeselect--open) .vue-treeselect__control),
:deep(.vue-treeselect--focused .vue-treeselect__control) {
    border-color: var(--color-blue-500);
    box-shadow: none;
}

:deep(.vue-treeselect__multi-value) {
    height: 100%;
    min-height: 3rem;
    width: 100%;
    display: inline-block;
    padding: 1.5rem 4.5rem .5rem .5rem; // right gap for the overlaid icons
}

// --items
:deep(.vue-treeselect__multi-value-item) {
    border-radius: 12px;
    border: 1px solid var(--color-zinc-300);
    background-color: var(--color-bg-hi) !important;
    min-height: 2rem !important;
}

:deep(.vue-treeselect__value-remove) {
    border-left: 1px solid var(--color-zinc-300);
    color: var(--color-blue-600);
}

:deep(.vue-treeselect__multi-value-label) {
    color: var(--color-blue-600);
    font-family: var(--font-primary);
}

// options
:deep(.vue-treeselect__menu) {
    border: 1px solid var(--color-gray-300);
    background-color: var(--color-zinc-100);
    margin-top: .5rem !important;
    margin-bottom: .5rem !important;
    border-radius: 5px;
}

:deep(.vue-treeselect__label) {
    color: var(--color-text-1);
}

:deep(.vue-treeselect__option--selected) {
    background: rgba(59, 130, 246, .08);
}

:deep(.vue-treeselect__option--highlight) {
    background: rgba(59, 130, 246, .12);
}
</style>
