<template>
    <div>
        <div class="mt-16 flex">
            <VSearch v-model="searchTerm" :clearable="true" placeholder="Search…" :debounce="150" />
            <VIconButton class="mr-2" type="red" icon="icon-delete" @click="showDeleteOrganisationModal" />
        </div>

        <VTable class="mt-4" 
            :search="searchTerm" 
            :selectable="true"
            :table-col="tableCol" 
            :table-data="tableData" 
            :sortKey="'path'" 
            :row-class="getOrgRowClass"
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
                <VIconButton icon="icon-view-more" @click="showUpdateOrganisationModal(row.uuid)" />
             </template>
        </VTable>

        <!-- Update Modal: opens organisation update form for selected organisation -->
        <VModal v-model="isUpdateModalOpen" size="xl">
            <template #header>
                <div class="vheading--2">Organisation Details</div>
            </template>
            <OrgUpdateView :organisationUuid="selectedOrganisationUuid"></OrgUpdateView>
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
                    Do you really want to delete this organisation?
                </p>
                <p v-else class="delete-modal__text">
                    Do you really want to delete these organisations?
                </p>
            </div>
            <template #footer>
                <button class="vbtn vbtn--zinc-lt" @click="isDeleteModalOpen = false">Cancel</button>
                <button class="vbtn vbtn--red" @click="deleteOrganisations">Delete</button>
            </template>
        </VModal>
    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboardStore';
import { useMessageStore } from '@/stores/messageStore';
import { useOrganisationStore } from '@/stores/organisationStore';
import type { TableColumn } from '@/types/table.column.type';
import { VSearch, ThePager, VTable, VIconButton, VModal } from '@/ui';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import OrgUpdateView from './OrgUpdateView.vue';
import { useRoute, useRouter } from 'vue-router';


// --- Router -------------------------------------------------------
const route = useRoute();
const router = useRouter();

// --- Stores ----------------------------------------------------------
const organisationStore = useOrganisationStore();
const { getOrganisationScope, getOrganisation } = storeToRefs(organisationStore);

const messageStore = useMessageStore();
const dashboardStore = useDashboardStore();

// --- Data ------------------------------------------------------------
const searchTerm = ref("");
const currentPage = ref(1);
const selectedKeys = ref<string[]>([]); // Organisation row selection

// Modal visibility state
const isUpdateModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedOrganisationUuid = ref<string | null>(null);

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

function clearMessage() {
    messageStore.clearFlashMessageList();
}

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

// Show delete modal if selection exists, else flash warning
function showDeleteOrganisationModal() {
    if (selectedKeys.value.length === 0) {
        messageStore.setFlashMessagesList(
            ["No organisation selected. Select a organisation to proceed with delete."],
            "flash-message--red", 2
        );
    } else {
        clearMessage();
        isDeleteModalOpen.value = true;
    }
}

// Show update modal for selected organisation (skip if already open on same organisation)
function showUpdateOrganisationModal(id: string) {
    if (id === selectedOrganisationUuid.value) return;
    isUpdateModalOpen.value = true;
    selectedOrganisationUuid.value = id;
}


// Called on delete modal confirm
async function deleteOrganisations() {
    try {
        isDeleteModalOpen.value = false;

        var payload = { 'organisation_ids': selectedKeys.value };

        const r = await organisationStore.deleteOrganisations(payload);

        for(let id of r.data.data.organisation_ids) {
            organisationStore.removeOrganisationFromStore(id);
        }

        // success → show confirmation
        messageStore.setFlashMessagesList(
            [r.data.message || "Organisation(s) deleted successfully."],
            "flash-message--blue"
        );
        
    } catch (err: any) {
        // Backend-provided error message
        const message = err?.response?.data?.message;

        if (message) {
            messageStore.setFlashMessagesList([message], "flash-message--orange");
            return;
        }

        console.error("! OrgListView deleteOrganisations !", err);

        // Fallback
        messageStore.setFlashMessagesList(
            ["An unexpected error occurred while deleting the organisation(s)."],
            "flash-message--orange"
        );
    }  finally {
        dashboardStore.setIsLoading(false);
    }
}

// --- Hooks -----------------------------------------------------------

onMounted(() =>{
    getOrgLevel("");
});

// --- Modal sync with URL query params -----------------------------


// 1. On mount, read modal state from query params
onMounted(() => {
    const q = route.query;
    const org_uuid = typeof q.org_uuid === 'string' ? q.org_uuid : null;
    const open = q.update === 'true' || q.update === '1';

    selectedOrganisationUuid.value = org_uuid;
    isUpdateModalOpen.value = !!(open && org_uuid) && route.name == 'organisations.list'; 
});

// 2. Watch for URL query changes (browser nav/manual edit)
watch(
    () => route.query,
    (q) => {
        const org_uuid = typeof q.org_uuid === 'string' ? q.org_uuid : null;
        const open = q.update === 'true' || q.update === '1';
       selectedOrganisationUuid.value = org_uuid;
        isUpdateModalOpen.value = !!(open && org_uuid)  && route.name == 'organisations.list';
    }
);

// 3. Watch modal state and write to URL (replace to avoid history spam)
watch([selectedOrganisationUuid, isUpdateModalOpen], ([org_uuid, open]) => {
    const next = { ...route.query };
    if (open && org_uuid) {
        next.update = 'true';
        next.org_uuid = org_uuid;
    } else {
        delete next.update;
        delete next.org_uuid;
    }
    router.replace({ query: next });
});

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
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

