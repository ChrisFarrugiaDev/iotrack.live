<template>
    <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
        <div class="vform__group mb-7 w-full" style="height: fit-content;">
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
                placeholder=""
            />
        </div>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { usePermissionStore } from '@/stores/permissionStore';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import Treeselect from 'vue3-treeselect';
import 'vue3-treeselect/dist/vue3-treeselect.css';

// - Store -------------------------------------------------------------
const permissionStore = usePermissionStore();
const { getGroupedPermissions } = storeToRefs(permissionStore);

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
    console.log(">", p)
    if (p && JSON.stringify(p) !== JSON.stringify(oldP)) {
        permissions.value = p;
        treeKey.value++; // Bump key to force re-render (keeps UI in sync, no flicker)
    }
}, {
    immediate: true,
});

// Debug: log permissions changes
watch(permissions, (p, oldP) => {

    if (JSON.stringify(p) !== JSON.stringify(oldP)) {
        emit('perm-changed', p);
    }
});
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
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
    padding: 1.5rem .5rem .5rem .5rem;
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
