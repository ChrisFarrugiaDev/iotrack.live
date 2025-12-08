<template>
    <div>
        <VTable 
            class="mt-4" 
            :search="searchTerm" 
            :table-col="tableCol" 
            :table-data="tableData"
            :per-page="25"
            v-model:page="currentPage"
             @update:page="currentPage = Number($emit)"             
        >
            <!-- Pagination slot for custom pager component -->
            <template #pagination="{ page, pageCount, setPage }">
                <ThePager class="justify-center w-100" :page="page" :page-count="pageCount" :set-page="setPage" />
            </template>

            <!-- Row action slot: view/edit button -->
             <template #actions="{ row }">
                <VIconButton icon="icon-view-more" @click="showUpdateUserModal(row.uuid)" />
             </template>
        </VTable>

        <!-- Update Modal: opens user update form for selected user -->
        <VModal v-model="isUpdateModalOpen" size="xl">
            <template #header>
                <div class="vheading--2">Device Details</div>
            </template>

        </VModal>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useOrganisationStore } from '@/stores/organisationStore';
import { usePermissionStore } from '@/stores/permissionStore';
import { useUserStore } from '@/stores/userStore';
import type { TableColumn } from '@/types/table.column.type';
import { VSearch, ThePager, VTable, VIconButton, VModal } from '@/ui';
import { formatLabel } from '@/utils/utils';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

// -- Store ------------------------------------------------------------

const userStore = useUserStore();
const { getUserScope } = storeToRefs(userStore);

const organisationStore = useOrganisationStore();
const {getOrganisationScope} = storeToRefs(organisationStore);

const permissionStore = usePermissionStore();
const { getRoles } = storeToRefs(permissionStore);

// --- Data ------------------------------------------------------------
const searchTerm = ref("");
const currentPage = ref(1);

// Modal visibility state
const isUpdateModalOpen = ref(false);
const selectedUserUuid = ref<string | null>(null);

const tableCol = ref<TableColumn[]>([
    {
        col: "ID",
        data: "id",
        sort: true,
        align: "left",
        hidden: false,
    },
    {
        col: "First Name",
        data: "first_name",
        sort: true,
        align: "left",  
    },
    {
        col: "Last Name",
        data: "last_name",
        sort: true,
        align: "left",  
    },
    {
        col: "Email",
        data: "email",
        sort: true,
        align: "left",  
    },
    {
        col: "Organisation",
        data: "org_name",
        sort: true,
        align: "left",  
    },
    {
        col: "Role",
        data: "role",
        sort: true,
        align: "left",  
    },
]);

// --- Data mapping for table display ----------------------------------

const tableData = computed(()=>{
    const users = Object.values(getUserScope.value || {});
    // console.log(users)
    const organisations = getOrganisationScope.value!;
    const roles = getRoles.value;
    if (!organisations) return [];
    
    return users.map( (user)=>{        
        const org_name = organisations[user.organisation_id!].name;
        
        const role = formatLabel(roles[user.role_id!]);
        return {...user, org_name, role }
    });    
});



// -- Methods ----------------------------------------------------------

// Show update modal for selected device (skip if already open on same device)
function showUpdateUserModal(id: string) {
    if (id === selectedUserUuid.value) return;
    isUpdateModalOpen.value = true;
    selectedUserUuid.value = id;
}



</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
.flex {
    display: flex;
    gap: .5rem;
}

.delete-modal {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    &__icon {
        width: 3.5rem;
        height: 3.5rem;
        fill: var(--color-red-500);
        color: var(--color-red-500);
        border: 2px solid currentColor;
        border-radius: 50%;
        padding: 6px;
        margin-bottom: 1rem;
    }

    &__text {
        text-align: center;
    }
}
</style>