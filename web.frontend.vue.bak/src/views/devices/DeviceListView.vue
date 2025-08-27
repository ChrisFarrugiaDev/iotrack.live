<template>
    <div>
        <!-- Search bar and delete button row -->
        <div class="mt-16 flex">
            <VSearch v-model="searchTerm" :clearable="true" placeholder="Search…" :debounce="150" />
            <VIconButton class="mr-2" type="red" icon="icon-delete" @click="showDeleteDeviceModal" />
        </div>

        <!-- Device table (with selection, pagination, actions) -->
        <VTable class="mt-4" :table-col="tableCol" :table-data="tableData" :search="searchTerm" :per-page="25"
            v-model:page="currentPage" row-key="id" :selectable="true" :searchTerm="searchTerm"
            @update:page="currentPage = Number($emit)" @update:selectedKeys="selectedKeys = ($event as any)">
            <!-- Pagination slot for custom pager component -->
            <template #pagination="{ page, pageCount, setPage }">
                <ThePager class="justify-center w-100" :page="page" :page-count="pageCount" :set-page="setPage" />
            </template>

            <!-- Row action slot: view/edit button -->
            <template #actions="{ row }">
                <div>
                    <!-- For ref: If you want router link, use this: 
                         <RouterLink :to="`/devices/${row.id}`" class="t-btns__btn" v-tooltip="{ content: 'View' }"
                        aria-label="View device">
                        <svg class="t-btns__icon">
                            <use xlink:href="@/ui/svg/sprite.svg#icon-view-more" />
                        </svg>
                    </RouterLink> -->

                    <VIconButton icon="icon-view-more" @click="showUpdateDeviceModal(row.uuid)" />
                </div>
            </template>
        </VTable>
    </div>

    <!-- Update Modal: opens device update form for selected device -->
    <VModal v-model="isUpdateModalOpen" size="xl">
        <template #header>
            <div class="vheading--2">Device Details</div>
        </template>
        <DeviceUpdateView ref="deviceUpdateRef" :devices="getDevices" :selectedDeviceUUID="selectedDeviceUUID"
            :organisations="getOrganisationScope" />
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
                Do you really want to delete this device?
            </p>
            <p v-else class="delete-modal__text">
                Do you really want to delete these devices?
            </p>
        </div>
        <template #footer>
            <button class="vbtn vbtn--zinc-lt" @click="isDeleteModalOpen = false">Cancel</button>
            <button class="vbtn vbtn--red" @click="deleteDevices">Delete</button>
        </template>
    </VModal>
</template>




<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useAssetStore } from '@/stores/assetStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { useOrganisationStore } from '@/stores/organisationStore';
import type { TableColumn } from '@/types/table.column.type';
import { VSearch, ThePager, VTable, VIconButton, VModal } from '@/ui';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import DeviceUpdateView from './DeviceUpdateView.vue';
import { useMessageStore } from '@/stores/messageStore';
import { useRoute, useRouter } from 'vue-router';

// --- Router -------------------------------------------------------
const route = useRoute();
const router = useRouter();

// --- Pinia Stores -------------------------------------------------
const deviceStore = useDeviceStore();
const { getDevices } = storeToRefs(deviceStore);

const assetStore = useAssetStore();
const { getAssets } = storeToRefs(assetStore);

const organisationStore = useOrganisationStore();
const { getOrganisationScope } = storeToRefs(organisationStore);

const messageStore = useMessageStore();

// --- Reactive State -----------------------------------------------
// Search/filter/pagination UI state
const searchTerm = ref("");
const currentPage = ref(1);
const selectedKeys = ref<string[]>([]); // Device row selection

// Modal visibility state
const isUpdateModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedDeviceUUID = ref<string | null>(null);

// --- Table Columns -----------------------------------------------
const tableCol = ref<TableColumn[]>([
    {
        col: "ID",
        data: "id",
        sort: true,
        align: "left",
    },
    {
        col: "Organisation",
        data: "organisation",
        sort: true,
        searchable: true,
        anchor: {
            enabled: true,
            urlKey: "organisation_url",
            target: "_blank",
        },
    },
    {
        col: "Asset",
        data: "asset",
        sort: true,
        searchable: true,
        anchor: {
            enabled: true,
            urlKey: "asset_url",
            target: "_blank",
        },
    },
    {
        col: "External ID",
        data: "external_id",
        searchable: true,
        sort: true,
    },
    {
        col: "Vendor",
        data: "vendor",
        searchable: true,
    },
    {
        col: "Model",
        data: "model",
        searchable: true,
    },
    {
        col: "Protocol",
        data: "protocol",
        searchable: true,
    },
    {
        col: "Status",
        data: "status",
        sort: true,
        align: "left",
    },
    {
        col: "Created At",
        data: "created_at",
        sort: true,
        align: "left",
        format: (value) => new Date(value).toLocaleString(), // Human-readable date
    },
]);

// --- Data mapping for table display ------------------------------
const tableData = computed(() => {
    // Map device rows to include related asset/organisation names and URLs
    const devices = Object.values(getDevices.value || {});
    const assets = getAssets.value || {};
    const organisations = getOrganisationScope.value || {};

    return devices.map((d) => {
        const asset = d.asset_id ? assets[d.asset_id] : null;
        const organisation = d.organisation_id ? organisations[d.organisation_id]?.name : null;

        return {
            ...d,
            asset: asset?.name || null,
            organisation: organisation || null,
            asset_url: d.asset_id ? `/assets/${d.asset_id}` : null,
            organisation_url: d.organisation_id ? `/organisations/${d.organisation_id}` : null,
            created_at: d.created_at ? new Date(d.created_at) : null,
        };
    });
});

// --- Methods ------------------------------------------------------

// --- for ref ---
// https://chatgpt.com/c/689bf2ec-b244-8329-9fda-9c46032b9206
// const deviceUpdateRef = ref<InstanceType<typeof DeviceUpdateView>>();
// function onSave() {
//     deviceUpdateRef.value?.updateDevice();
// }
// --------------

// Show delete modal if selection exists, else flash warning
function showDeleteDeviceModal() {
    if (selectedKeys.value.length === 0) {
        messageStore.setFlashMessagesList(
            ["No device selected. Select a device to proceed with delete."],
            "flash-message--red", 2
        );
    } else {
        isDeleteModalOpen.value = true;
    }
}

// Show update modal for selected device (skip if already open on same device)
function showUpdateDeviceModal(id: string) {
    if (id === selectedDeviceUUID.value) return;
    isUpdateModalOpen.value = true;
    selectedDeviceUUID.value = id;
}

// Called on delete modal confirm
function deleteDevices() {
    console.log(selectedKeys.value);
    isDeleteModalOpen.value = false;
    // TODO: Call store action to delete devices, refresh data, etc
}

// --- Modal sync with URL query params -----------------------------

// 1. On mount, read modal state from query params
onMounted(() => {
    const q = route.query;
    const uuid = typeof q.uuid === 'string' ? q.uuid : null;
    const open = q.update === 'true' || q.update === '1';
    selectedDeviceUUID.value = uuid;
    isUpdateModalOpen.value = !!(open && uuid); // Only open if we have an id
});

// 2. Watch for URL query changes (browser nav/manual edit)
watch(
    () => route.query,
    (q) => {
        const uuid = typeof q.uuid === 'string' ? q.uuid : null;
        const open = q.update === 'true' || q.update === '1';
        selectedDeviceUUID.value = uuid;
        isUpdateModalOpen.value = !!(open && uuid);
    }
);

// 3. Watch modal state and write to URL (replace to avoid history spam)
watch([selectedDeviceUUID, isUpdateModalOpen], ([uuid, open]) => {
    const next = { ...route.query };
    if (open && uuid) {
        next.update = 'true';
        next.uuid = uuid;
    } else {
        delete next.update;
        delete next.uuid;
    }
    router.replace({ query: next });
});

</script>


<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
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
