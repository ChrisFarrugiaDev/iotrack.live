<template>
    <!-- Quick-pick: bulk-add all assets of a group to the selection -->
    <div v-if="groupOptions.length" class="vform__row" :class="{ 'vform__disabled': confirmOn }">
        <div class="vform__group mb-7">
            <label class="vform__label" for="asset_group">Add assets by group</label>
            <VueSelect
                v-model="groupPick"
                class="vform__group"
                :shouldAutofocusOption="false"
                :isDisabled="confirmOn"
                :style="vueSelectStyles"
                :options="groupOptions"
                placeholder=""
                id="asset_group"
            />
        </div>
    </div>

    <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
        <div class="vform__group tree-field mb-7 w-full" style="height: fit-content;">
            <label class="vform__label" for="assets">Assets</label>
            <!-- TreeSelect (force re-render with :key to sync changes instantly) -->
            <Treeselect
                :key="treeKey"
                v-model="assets"
                :multiple="true"
                :options="assetsOptions"
                :disabled="confirmOn"
                :show-count="true"
                value-consists-of="LEAF_PRIORITY"
                :limit="10"
                :limit-text="limitText"
                placeholder=""
            />

            <!-- Sprite icons matching the standard select fields -->
            <div class="tree-field__icons">
                <svg
                    v-if="!confirmOn && assets?.length"
                    class="tree-field__icon tree-field__icon--clear"
                    @mousedown.prevent.stop="clearAssets"
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
import { useUserAssignableStore } from '@/stores/userAssignableStore';
import { useGroupStore } from '@/stores/groupStore';
import { useVueSelectStyles } from '@/composables/useVueSelectStyles';
import { computed, ref, watch } from 'vue';

import VueSelect from 'vue3-select-component';
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
const groupStore = useGroupStore();

// - Data --------------------------------------------------------------
const treeKey = ref(1); // Used to force Treeselect re-render

// Collapses selected chips beyond :limit into a single "and N more" tag.
function limitText(count: number) {
    return `and ${count} more`;
}

function clearAssets() {
    assets.value = [];
    treeKey.value++;
}

const assets = ref<any>();
const assetsOptions = ref<Record<string, any>[]>([]);

// - Select by group -----------------------------------------------------

const vueSelectStyles = useVueSelectStyles();

// '' = no group (default). The full tree stays visible either way.
const groupPick = ref<string>('');

const groupOptions = computed(() => {
    const groups = groupStore.getGroups ?? {};
    const assetGroups = Object.values(groups)
        .filter(g => g.type === 'asset')
        .map(g => ({ label: g.name, value: g.id }));

    return [{ label: 'All assets (no group)', value: '' }, ...assetGroups];
});

// Leaf ids available in the current org scope.
function optionLeafIds(): Set<string> {
    const ids = new Set<string>();
    for (const branch of assetsOptions.value) {
        for (const child of branch.children ?? []) {
            ids.add(String(child.id));
        }
    }
    return ids;
}

// Picking a group replaces the selection with that group's members
// (limited to the current org scope). "All assets" selects everything in scope.
watch(groupPick, async (groupId) => {
    if (!groupId) {
        assets.value = Array.from(optionLeafIds());
        treeKey.value++;
        return;
    }

    const res = await groupStore.fetchGroupItems('asset', groupId);
    const memberIds: string[] = res?.data?.asset_ids ?? [];

    const available = optionLeafIds();
    assets.value = memberIds.map(String).filter(id => available.has(id));
    treeKey.value++; // Re-render Treeselect with the new selection
});


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