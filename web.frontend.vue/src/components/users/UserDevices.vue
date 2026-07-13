<template>
    <!-- Quick-pick: bulk-add all devices of a group to the selection -->
    <div v-if="groupOptions.length" class="vform__row" :class="{ 'vform__disabled': confirmOn }">
        <div class="vform__group mb-7">
            <label class="vform__label" for="device_group">Add devices by group</label>
            <VueSelect
                v-model="groupPick"
                class="vform__group"
                :shouldAutofocusOption="false"
                :isDisabled="confirmOn"

                :options="groupOptions"
                placeholder=""
                id="device_group"
            />
        </div>
    </div>

    <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
        <div class="vform__group tree-field mb-7 w-full" style="height: fit-content;">
            <label class="vform__label" for="devices">Devices</label>
            <!-- TreeSelect (force re-render with :key to sync changes instantly) -->
            <Treeselect
                :key="treeKey"
                v-model="devices"
                :multiple="true"
                :options="devicesOptions"
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
                    v-if="!confirmOn && devices?.length"
                    class="tree-field__icon tree-field__icon--clear"
                    @mousedown.prevent.stop="clearDevices"
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
import { useDeviceStore } from '@/stores/deviceStore';
import { useUserAssignableStore } from '@/stores/userAssignableStore';
import { useGroupStore } from '@/stores/groupStore';
import { storeToRefs } from 'pinia';
import { computed, ref, watch, watchEffect } from 'vue';

import VueSelect from 'vue3-select-component';
import Treeselect from 'vue3-treeselect';
import 'vue3-treeselect/dist/vue3-treeselect.css';

// - Props -------------------------------------------------------------
const props = defineProps<{
    confirmOn: boolean,
    defaultDevices?: string[],
    filterDevicesByUser?: boolean,
}>();

// - Emits -------------------------------------------------------------

const emit = defineEmits<{
    (e: 'devices-changed', value: string[]): void
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

function clearDevices() {
    devices.value = [];
    treeKey.value++;
}

const devices = ref<any>();
const devicesOptions = ref<Record<string, any>[]>([]);

// - Select by group -----------------------------------------------------


// '' = no group (default). The full tree stays visible either way.
const groupPick = ref<string>('');

const groupOptions = computed(() => {
    const groups = groupStore.getGroups ?? {};
    const deviceGroups = Object.values(groups)
        .filter(g => g.type === 'device')
        .map(g => ({ label: g.name, value: g.id }));

    return [{ label: 'All devices (no group)', value: '' }, ...deviceGroups];
});

// Leaf ids available in the current org scope.
function optionLeafIds(): Set<string> {
    const ids = new Set<string>();
    for (const branch of devicesOptions.value) {
        for (const child of branch.children ?? []) {
            ids.add(String(child.id));
        }
    }
    return ids;
}

// Picking a group replaces the selection with that group's members
// (limited to the current org scope). "All devices" selects everything in scope.
watch(groupPick, async (groupId) => {
    if (!groupId) {
        devices.value = Array.from(optionLeafIds());
        treeKey.value++;
        return;
    }

    const res = await groupStore.fetchGroupItems('device', groupId);
    const memberIds: string[] = res?.data?.device_ids ?? [];

    const available = optionLeafIds();
    devices.value = memberIds.map(String).filter(id => available.has(id));
    treeKey.value++; // Re-render Treeselect with the new selection
});

// - Watch -------------------------------------------------------------

watch(()=> userAssignableStore.getSelectedOrgId, async () => {
    if (props.filterDevicesByUser) {
        userAssignableStore.filterDevicesByUser = true;
    }
    const grpDevices = userAssignableStore.getGroupedDevices;
    devicesOptions.value = Object.values(grpDevices);
    
    userAssignableStore.filterDevicesByUser = false;

},{
    deep: true,
    immediate: true,
});


watch(()=>props.defaultDevices, (dvs, oldDvs) => {
    
    if (dvs && JSON.stringify(dvs) !== JSON.stringify(oldDvs)) {

        devices.value = dvs;
        treeKey.value++; // Bump key to force re-render (keeps UI in sync, no flicker)
    }
},{ 
    immediate: true,
});


watch(devices, (v, oldV) => {

    if (JSON.stringify(v) !== JSON.stringify(oldV)) {
        emit('devices-changed', v);
    }
}, {
    immediate: true
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