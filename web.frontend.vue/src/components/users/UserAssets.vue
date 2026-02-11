<template>
    <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
        <div class="vform__group mb-7 w-full" style="height: fit-content;">
            <label class="vform__label" for="assets">Assets</label>
            <!-- TreeSelect (force re-render with :key to sync changes instantly) -->
            <Treeselect
                :key="treeKey"
                v-model="assets"
                :multiple="true"
                :options="assetsOptions"
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
import { useUserAssignableStore } from '@/stores/userAssignableStore';
import { watch } from 'vue';
import { ref } from 'vue';

import Treeselect from 'vue3-treeselect';
import 'vue3-treeselect/dist/vue3-treeselect.css';

// - Props -------------------------------------------------------------
const props = defineProps<{
    confirmOn: boolean,
    defaultAssets?: string[],
    filterAssetsByUser?: boolean,
}>();

// - Emits -------------------------------------------------------------

const emit = defineEmits<{
    (e: 'assets-changed', value: string[]): void
}>();

// - Store -------------------------------------------------------------

const userAssignableStore = useUserAssignableStore();

// - Data --------------------------------------------------------------
const treeKey = ref(1); // Used to force Treeselect re-render

const assets = ref<any>();
const assetsOptions = ref<Record<string, any>[]>([]);


// - Watch -------------------------------------------------------------

watch(()=> userAssignableStore.getSelectedOrgId, async () => {

    if (props.filterAssetsByUser) {
        userAssignableStore.filterAssetsByUser = true;
    }
    const grpAssets = userAssignableStore.getGroupedAssets;    
    assetsOptions.value = Object.values(grpAssets);

    userAssignableStore.filterAssetsByUser = false;

},{
    deep: true,
    immediate: true,
});


watch(()=>props.defaultAssets, (ass, oldAss) => {
    
    if (ass && JSON.stringify(ass) !== JSON.stringify(oldAss)) {

        assets.value = ass;
        treeKey.value++; // Bump key to force re-render (keeps UI in sync, no flicker)
    }
},{ 
    immediate: true,
    deep:true,
});


watch(assets, (v, oldV) => {

    if (JSON.stringify(v) !== JSON.stringify(oldV)) {
        emit('assets-changed', v);
    }
}, {
    immediate: true,
    deep:true,
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
:deep(.vue-treeselect--focused:not(.vue-treeselect--open) .vue-treeselect__control) {
    border-color: var(--color-blue-500);
    box-shadow: none;
}
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
    border-radius: 5px;
    background-color: var(--color-zinc-100);
    margin-top: .5rem !important;
    margin-bottom: .5rem !important;

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