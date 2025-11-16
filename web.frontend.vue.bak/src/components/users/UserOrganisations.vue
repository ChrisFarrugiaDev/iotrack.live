<template>
    <div class="vform__row " :class="{ 'vform__disabled': confirmOn }">
        <div class="vform__group mb-7 w-full">
            <label class="vform__label" for="organisations">Organisations</label>

            <Treeselect :key="treeKey" v-model="organisations" :multiple="true" :options="organisationsOptions" placeholder=""
                :disabled="confirmOn" :show-count="true" :flat="true"/>
        </div>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useOrganisationStore } from '@/stores/organisationStore';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import Treeselect from 'vue3-treeselect';
import 'vue3-treeselect/dist/vue3-treeselect.css';

const organisationStore = useOrganisationStore();
const { getGroupedOrganisations, getOrganisationScope, getOrganisation } = storeToRefs(organisationStore);


const props = defineProps<{
    confirmOn: boolean,
    // organisationsOptions: Record<string, any>[]
}>();


const organisations = ref<any>();
const organisationsOptions = ref<Record<string, any>[]>([]);

const treeKey = ref(1); // Used to force Treeselect re-render

watch(getGroupedOrganisations, (grpOrgs) => {

    organisationsOptions.value = grpOrgs;
},{
    deep: true,
    immediate: true,
})


watch(getOrganisationScope, (orgs) => {

    const parentOrg = getOrganisation.value;

    if (orgs && parentOrg) {
        delete orgs[parentOrg.id]
        organisations.value = Object.keys(orgs);
        treeKey.value++;
    }
},{
    deep: true,
    immediate: true,
})

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