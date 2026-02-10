<template>
	<div>
        <!-- Search bar and delete button row -->
        <div class="mt-16 flex">
            <VSearch v-model="searchTerm" :clearable="true" placeholder="Search…" :debounce="150" />
            <VIconButton v-if="authorizationStore.can('group.delete')" class="mr-2" type="red" icon="icon-delete" @click="showDeleteGroupModal" />
        </div>

        <VTable class="mt-4" 
            :table-col="tableCol" 
            :table-data="tableData" 
            :search="searchTerm" 
            :per-page="25"
            v-model:page="currentPage" 
            row-key="id" 
            :selectable="true" 
            @update:page="currentPage = Number($emit)" 
            @update:selectedKeys="selectedKeys = ($event as any)"

        >
            <template #actions="{ row }">          
                <VIconButton v-if="authorizationStore.can('group.update')" icon="icon-view-more" @click="showUpdateGroupModal(row.uuid)"/>
            </template>

        </VTable>

	</div>
    <!-- Update Modal: opens group update form for selected group -->
    <VModal v-model="isUpdateModalOpen" size="xl">
        <template #header>
            <div class="vheading--2">Group Details</div>
        </template>
        <GroupUpdateView :groupUuid="selectedGroupUUID" :groups="getGroups" />
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
                Do you really want to delete this group?
            </p>
            <p v-else class="delete-modal__text">
                Do you really want to delete these groups?
            </p>
        </div>

        <template #footer>
            <button class="vbtn vbtn--zinc-lt" @click="isDeleteModalOpen = false">Cancel</button>
            <button class="vbtn vbtn--red" @click="deleteGroups">Delete</button>
        </template>
    </VModal>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { TableColumn } from '@/types/table.column.type';
import { VSearch, ThePager, VTable, VIconButton, VModal } from '@/ui';
import { useGroupStore } from '@/stores/groupStore';
import { storeToRefs } from 'pinia';
import { useAuthorizationStore } from '@/stores/authorizationStore';
import { useMessageStore } from '@/stores/messageStore';
import { formatDateYMDHM } from '@/utils/dateTimeUtils';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useRoute, useRouter } from 'vue-router';
import GroupUpdateView from './GroupUpdateView.vue';

// --- Store -----------------------------------------------------------

const groupStore = useGroupStore();
const { getGroups } = storeToRefs(groupStore);

const authorizationStore = useAuthorizationStore();

const messageStore = useMessageStore();
const dashboardStore = useDashboardStore();

// --- Router -------------------------------------------------------
const route = useRoute();
const router = useRouter();

// --- Reactive State --------------------------------------------------
// Search/filter/pagination UI state
const searchTerm = ref("");
const currentPage = ref(1);
const selectedKeys = ref<string[]>([]); // Group row selection

// Modal visibility state
const isUpdateModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedGroupUUID = ref<string | null>(null);

// --- Table Columns ---------------------------------------------------
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
		col: "Type",
        data: "type",
        sort: true,
        align: "left",
	},
	{
		col: "Items",
        data: "items",
        sort: true,
        align: "left",
	},
    {
        col: "Created At",
        data: "created_at",
        sort: true,
        align: "left",
        format: (value) => formatDateYMDHM(new Date(value)), // Human-readable date
    },

]);

// --- Data mapping for table display ----------------------------------
const tableData = computed(() => {
    const groups = Object.values(getGroups.value || {} );

    
    return groups.map(gg => {
        return {
            ...gg,
            created_at: gg.created_at ? new Date(gg.created_at) : null,
        }
    });
});

// --- Methods ---------------------------------------------------------

function clearMessage() {
    messageStore.clearFlashMessageList();
}

// Show update modal for selected group (skip if already open on same group)
function showUpdateGroupModal(id: string) {
    if (id === selectedGroupUUID.value) return;
    isUpdateModalOpen.value = true;
    selectedGroupUUID.value = id;
}

// Show delete modal if selection exists, else flash warning
function showDeleteGroupModal() {
    if (selectedKeys.value.length === 0) {
        messageStore.setFlashMessagesList(
            ["No group selected. Select a group to proceed with delete."],
            "flash-message--red", 2
        );
    } else {
        clearMessage();
        isDeleteModalOpen.value = true;
    }
}

// Called on delete modal confirm
async function deleteGroups() {
    dashboardStore.setIsLoading(true);
    try {
        isDeleteModalOpen.value = false;

        var payload = { 'group_ids': selectedKeys.value };

        const r = await groupStore.deleteGroup(payload);

        for(let id of r.data.data.group_ids) {
            groupStore.removeAssetFromStore(id);
        }

        // success → show confirmation
        messageStore.setFlashMessagesList(
            [r.data.message || "Group(s) deleted successfully."],
            "flash-message--blue"
        );

    } catch (err: any) {
        // Backend-provided error message
        const message = err?.response?.data?.message;

        if (message) {
            messageStore.setFlashMessagesList([message], "flash-message--orange");
            return;
        }

        console.error("! GroupListView deleteGroups !", err);

        // Fallback
        messageStore.setFlashMessagesList(
            ["An unexpected error occurred while deleting the group(s)."],
            "flash-message--orange"
        );
    } finally {
        dashboardStore.setIsLoading(false);
    }
}

// --- Modal sync with URL query params -----------------------------

// 1. On mount, read modal state from query params
onMounted(() => {
    const q = route.query;
    const group_uuid = typeof q.group_uuid === 'string' ? q.group_uuid : null;
    const open = q.update === 'true' || q.update === '1';
    selectedGroupUUID.value = group_uuid;
    isUpdateModalOpen.value = !!(open && group_uuid) && route.name == 'groups.list'; // Only open if we have an id
});

// 2. Watch for URL query changes (browser nav/manual edit)
watch(
    () => route.query,
    (q) => {
        const group_uuid = typeof q.group_uuid === 'string' ? q.group_uuid : null;
        const open = q.update === 'true' || q.update === '1';
        selectedGroupUUID.value = group_uuid;
        isUpdateModalOpen.value = !!(open && group_uuid)  && route.name == 'groups.list';
    }
);

// 3. Watch modal state and write to URL (replace to avoid history spam)
watch([selectedGroupUUID, isUpdateModalOpen], ([group_uuid, open]) => {
    const next = { ...route.query };
    if (open && group_uuid) {
        next.update = 'true';
        next.group_uuid = group_uuid;
    } else {
        delete next.update;
        delete next.group_uuid;
    }
    router.replace({ query: next });
});

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
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