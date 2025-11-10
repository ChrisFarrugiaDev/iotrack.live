<template>
    <div>
        <VTable class="mt-4" :table-col="tableCol" :table-data="tableData"></VTable>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useOrganisationStore } from '@/stores/organisationStore';
import type { TableColumn } from '@/types/table.column.type';
import { VSearch, ThePager, VTable, VIconButton, VModal } from '@/ui';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

// --- Pinia Stores -------------------------------------------------
const organisationStore = useOrganisationStore();
const { getOrganisationScope } = storeToRefs(organisationStore);

const tableCol = ref<TableColumn[]>([
    {
        col: "ID",
        data: "id",
        sort: true,
        align: "left",
    },
    {
        col: "Name",
        data: "name",
        sort: true,
        align: "left",
    },
    {
        col: "Path",
        data: "path",
        sort: true,
        align: "left",
    },
    {
        col: "Can Inherit API Keys",
        data: "can_inherit_key",
        sort: true,
        align: "left",
    },
    {
        col: "Created At",
        data: "created_at",
        sort: true,
        align: "left",
    },
]);

// --- Data mapping for table display ------------------------------

const tableData = computed(()=>{
    const organisations = Object.values(getOrganisationScope.value || {});
    console.log(organisations)

    return organisations.map( (org)=>{
        return {...org, org}
    });
    
})


</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>