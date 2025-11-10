<template>
    <div>
        <div class="mt-16 flex">
            <VSearch v-model="searchTerm" :clearable="true" placeholder="Search…" :debounce="150" />
            
        </div>
        <VTable class="mt-4" 
            :search="searchTerm" 
            :table-col="tableCol" 
            :table-data="tableData" 
            :sortKey="'path'" 
            :row-class="getOrgRowClass"
            :per-page="25"
            v-model:page="currentPage"
             @update:page="currentPage = Number($emit)"
        >

            <!-- Pagination slot for custom pager component -->
            <template #pagination="{ page, pageCount, setPage }">
                <ThePager class="justify-center w-100" :page="page" :page-count="pageCount" :set-page="setPage" />
            </template>
        </VTable>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useOrganisationStore } from '@/stores/organisationStore';
import type { TableColumn } from '@/types/table.column.type';
import { VSearch, ThePager, VTable, VIconButton, VModal } from '@/ui';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

// --- Stores ----------------------------------------------------------
const organisationStore = useOrganisationStore();
const { getOrganisationScope, getOrganisation } = storeToRefs(organisationStore);

// --- Data ------------------------------------------------------------
const searchTerm = ref("");
const currentPage = ref(1);

const tableCol = ref<TableColumn[]>([
    {
        col: "ID",
        data: "id",
        sort: true,
        align: "left",
        hidden: true,
    },
    {
        col: "Path",
        data: "path",
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
        col: "Parent",
        data: "parent_org_name",
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
        format: (value) => new Date(value).toLocaleString(),
    },
]);

// --- Data mapping for table display ----------------------------------

const tableData = computed(()=>{
    const organisations = Object.values(getOrganisationScope.value || {});
    return organisations.map( (org)=>{
        const level = getOrgLevel(org.path); 
        return {...org, level}
    });
    
})

// --- Methods ---------------------------------------------------------

function getOrgRowClass(row: any) {
  if (row.level === 0) return 'org-parent';
  if (row.level === 1) return 'org-child';
  if (row.level <= 2) return 'org-grandchild';
  return '';
}

function getOrgLevel(path: string) {
    if (!getOrganisation.value) return 0;

    const pPath = getOrganisation.value.path;

    return path.split(",").length - pPath.split(",").length; 
}

onMounted(() =>{
    getOrgLevel("");
})
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly


.hello {
    opacity: 1;
}
</style>

