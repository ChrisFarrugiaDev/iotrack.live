<template>
    <div >
        <div class="mt-16 flex">
            <VSearch v-model="searchTerm" :clearable="true" placeholder="Search…" :debounce="150" />
            <VIconButton class="mr-2" type="red" icon="icon-delete" @click="showDeleteUserModal" />
        </div>

        <VTable 
            class="mt-4" 
            :search="searchTerm" 
            :selectable="true"
            :table-col="tableCol" 
            :table-data="tableData"
            :per-page="25"
            v-model:page="currentPage"
            @update:page="currentPage = Number($emit)"     
            @update:selectedKeys="selectedKeys = ($event as any)"        
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
                <div class="vheading--2">User Details</div>
            </template>

        </VModal>

        <!-- Delete Confirmation Modal -->
        <VModal v-model="isDeleteModalOpen" size="xs">
            <template #header>
                <div class="vheading--3">Delete Confirmation</div>
            </template>
            <div class="delete-modal">
                <svg class="delete-modal__icon">
                    <use xlink:href="@/ui/svg/sprite.svg#icon-close" />
                </svg>
                <p v-if="selectedKeys.length === 1" class="delete-modal__text">
                    Do you really want to delete this user?
                </p>
                <p v-else class="delete-modal__text">
                    Do you really want to delete these users?
                </p>
            </div>
            <template #footer>
                <button class="vbtn vbtn--zinc-lt" @click="isDeleteModalOpen = false">Cancel</button>
                <button class="vbtn vbtn--red" @click="deleteUser">Delete</button>
            </template>
        </VModal>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboardStore';
import { useMessageStore } from '@/stores/messageStore';
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

const messageStore = useMessageStore();
const dashboardStore = useDashboardStore();

// --- Data ------------------------------------------------------------
const searchTerm = ref("");
const currentPage = ref(1);
const selectedKeys = ref<string[]>([]); // User row selection

// Modal visibility state
const isUpdateModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
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
function clearMessage() {
    messageStore.clearFlashMessageList();
}

// Show delete modal if selection exists, else flash warning
function showDeleteUserModal() {
    if (selectedKeys.value.length === 0) {
        messageStore.setFlashMessagesList(
            ["No user selected. Select a user to proceed with delete."],
            "flash-message--red", 2
        );
    } else {
        clearMessage();
        isDeleteModalOpen.value = true;
    }
}

// Show update modal for selected user (skip if already open on same user)
function showUpdateUserModal(id: string) {
    if (id === selectedUserUuid.value) return;
    isUpdateModalOpen.value = true;
    selectedUserUuid.value = id;
}

// Called on delete modal confirm
async function deleteUser() {
    try {
        isDeleteModalOpen.value = false;        

        var payload = { 'user_ids': selectedKeys.value };

        const r = await userStore.deleteUsers(payload);

        for(let id of r.data.data.user_ids) {
            userStore.removeUserFromStore(id);
        }

        // success → show confirmation
        messageStore.setFlashMessagesList(
            [r.data.message || "User(s) deleted successfully."],
            "flash-message--blue"
        );
        
    } catch (err: any) {

        // Backend-provided error message
        const message = err?.response?.data?.message;

        if (message) {
            messageStore.setFlashMessagesList([message], "flash-message--orange");
            return;
        }

        console.error("! UserListView deleteUser !", err);

        // Fallback
        messageStore.setFlashMessagesList(
            ["An unexpected error occurred while deleting the user(s)."],
            "flash-message--orange"
        );
    } finally {
        dashboardStore.setIsLoading(false);
    }
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