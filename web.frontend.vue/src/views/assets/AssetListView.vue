<template>
    <div >        
        <!-- Search bar and delete button row -->
        <div class="mt-16 flex">
            <VSearch v-model="searchTerm" :clearable="true" placeholder="Search…" :debounce="150" />
            <VIconButton v-if="authorizationStore.can('asset.delete')" class="mr-2" type="red" icon="icon-delete" @click="showDeleteAssetModal" />
        </div>

        <VTable class="mt-4"
            :table-col="tableCol"
            :table-data="tableData"
            :search="searchTerm" :per-page="25"
            v-model:page="currentPage"
            row-key="id" :selectable="true"  
            :clearSelected="clearSelected"
            @update:page="currentPage = Number($emit)"
            @update:selectedKeys="selectedKeys = ($event as any)">

            <template #actions="{ row }">          
                <VIconButton v-if="authorizationStore.can('asset.update')" icon="icon-image" @click="showUpdateImageModalOpen(row.id)"/>
                <VIconButton v-if="authorizationStore.can('asset.update')" icon="icon-view-more" @click="showUpdateAssetModal(row.uuid)"/>
            </template>

            <!-- Pagination slot for custom pager component -->
            <template #pagination="{ page, pageCount, setPage }">
                <ThePager class="justify-center w-100" :page="page" :page-count="pageCount" :set-page="setPage" />
            </template>
        </VTable>

    </div>

    <!-- Update Modal: opens asset update form for selected asset -->
    <VModal v-model="isUpdateModalOpen" size="xl">
        <template #header>
            <div class="vheading--2">Asset Details</div>
        </template>
        <AssetUpdateView :assetUuid="selectedAssetUUID" :assets="getAssets" />
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
                Do you really want to delete this asset?
            </p>
            <p v-else class="delete-modal__text">
                Do you really want to delete these assets?
            </p>
        </div>
        <template #footer>
            <button class="vbtn vbtn--zinc-lt" @click="isDeleteModalOpen = false">Cancel</button>
            <button class="vbtn vbtn--red" @click="deleteAssets">Delete</button>
        </template>
    </VModal>
    
    <UpdateImagesModal v-model="isUpdateImageModalOpen" :selectedAssetID="selectedAssetID" size="lg"></UpdateImagesModal>

</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useAssetStore } from '@/stores/assetStore';
import { useMessageStore } from '@/stores/messageStore';
import { useOrganisationStore } from '@/stores/organisationStore';
import type { TableColumn } from '@/types/table.column.type';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { VSearch, ThePager, VTable, VIconButton, VModal } from '@/ui';
import { useDeviceStore } from '@/stores/deviceStore';
import AssetUpdateView from './AssetUpdateView.vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/axios';
import { useAppStore } from '@/stores/appStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import UpdateImagesModal from '@/components/images/update_image_modal/UpdateImagesModal.vue';
import { useAuthorizationStore } from '@/stores/authorizationStore';
import { formatDateYMDHM } from '@/utils/dateTimeUtils';


// - Store -------------------------------------------------------------
const assetStore = useAssetStore();
const { getAssets } = storeToRefs(assetStore);

const organisationStore = useOrganisationStore();
const { getOrganisationScope } = storeToRefs(organisationStore);

const deviceStore = useDeviceStore();
const { getDevices } = storeToRefs(deviceStore);

const messageStore = useMessageStore();
const appStore = useAppStore();

const dashboardStore = useDashboardStore();

const authorizationStore = useAuthorizationStore();

// --- Router -------------------------------------------------------
const route = useRoute();
const router = useRouter();


// - Data --------------------------------------------------------------
// state for search & pagination
const searchTerm = ref("");
const currentPage = ref(1);
const selectedKeys = ref<string[]>([])

// Modal visibility state
const isUpdateModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedAssetUUID = ref<string | null>(null);

const isUpdateImageModalOpen = ref(false);
const selectedAssetID = ref<string | null>(null);


const tableCol = ref<TableColumn[]>([
    {
        col: "ID",
        data: "id",
        sort: true,
        align: "left",
        // hidden: true
    },
    {
        col: "Organisation",
        data: "organisation",
        sort: true,
        searchable: true,
        to: (row) => row.organisation_url
    },
    {
        col: "Name",
        data: "name",
        sort: true,
        searchable: true,
    },
    {
        col: "Type",
        data: "asset_type",
        sort: true,
        searchable: true,
    },
    {
        col: "Tracking Device",
        data: "tracking_device",
        sort: true,
        searchable: true,
        // anchor: {enabled: true, urlKey: "tracking_device_url"}
        to: (row) => row.tracking_device_url
    },
        {
        col: "Created At",
        data: "created_at",
        sort: true,
        format: (value) => formatDateYMDHM(new Date(value)),
        align: "left"
    }


]);

const clearSelected = ref<number>(0);


// - Computed ----------------------------------------------------------

const tableData = computed(() => {
    const assets = Object.values(getAssets.value || {});

    const devices = getDevices.value || {};
    
    const organisations = getOrganisationScope.value || {};

    return assets.map((a) => {

        const organisation = a.organisation_id ? organisations[a.organisation_id] : null;        
        const organisationName = organisation ? organisation?.name : null;        

        const device = a.devices?.length ? a.devices[0] : null
        const tracking_device = device ?  devices[device.id] : null;

        return {
            ...a,
            
            organisation: organisationName ?? "",            
            organisation_url: organisation ? `/organisations?update=true&org_uuid=${organisation.uuid}` : "/organisations",

            tracking_device : tracking_device?.external_id || null,
            tracking_device_url: tracking_device ? `/devices?update=true&device_uuid=${tracking_device?.uuid}` : "/assets",             

            created_at: a.created_at ? new Date(a.created_at) : null,
        };
    });
});


// - Methods -----------------------------------------------------------
function clearMessage() {
    messageStore.clearFlashMessageList();
}

// Show update modal for selected asset (skip if already open on same asset)
function showUpdateAssetModal(id: string) {
    if (id === selectedAssetUUID.value) return;
    isUpdateModalOpen.value = true;
    selectedAssetUUID.value = id;
}

function showUpdateImageModalOpen (id: string) {
    isUpdateImageModalOpen.value = true;
    selectedAssetID.value = id;
}


// Show delete modal if selection exists, else flash warning
function showDeleteAssetModal() {
    if (selectedKeys.value.length === 0) {
        messageStore.setFlashMessagesList(
            ["No asset selected. Select an asset to proceed with delete."],
            "flash-message--red", 2
        );
    } else {
        clearMessage();
        isDeleteModalOpen.value = true;
    }
}

// Called on delete modal confirm
async function deleteAssets() {
    dashboardStore.setIsLoading(true);

    try {        
        var payload = { 'asset_ids': selectedKeys.value };        

        const r = await assetStore.deleteAssets(payload);

        selectedKeys.value = [];
        clearSelected.value += 1;

        const url = appStore.getAppUrl + "/img/delete";

        for(let id of r.data.data.asset_ids) {

            assetStore.removeAssetFromStore(id);       

            const payload = {
                entity_type: "asset",
                entity_id: Number(id)
            }
            const r = await axios.request({
                url,
                method: "DELETE",
                data: payload
            });     
        }    
      

        // success → show confirmation
        messageStore.setFlashMessagesList(
            [r.data.message || "Asset(s) deleted successfully."],
            "flash-message--blue"
        );       

    } catch (err: any) {        

        // Backend-provided error message
        const message = err?.response?.data?.message;

        if (message) {
            messageStore.setFlashMessagesList([message], "flash-message--orange");
            return;
        }

        console.error("! AssetDeleteView deleteAssets !", err);

        // Fallback
        messageStore.setFlashMessagesList(
            ["An unexpected error occurred while deleting the asset(s)."],
            "flash-message--orange"
        );
    } finally {
        isDeleteModalOpen.value = false;
        dashboardStore.setIsLoading(false);
    }
}




// --- Modal sync with URL query params -----------------------------

// 1. On mount, read modal state from query params
onMounted(() => {
    const q = route.query;
    const asset_uuid = typeof q.asset_uuid === 'string' ? q.asset_uuid : null;
    const open = q.update === 'true' || q.update === '1';
    selectedAssetUUID.value = asset_uuid;
    isUpdateModalOpen.value = !!(open && asset_uuid) && route.name == 'assets.list'; // Only open if we have an id
});

// 2. Watch for URL query changes (browser nav/manual edit)
watch(
    () => route.query,
    (q) => {
        const asset_uuid = typeof q.asset_uuid === 'string' ? q.asset_uuid : null;
        const open = q.update === 'true' || q.update === '1';
        selectedAssetUUID.value = asset_uuid;
        isUpdateModalOpen.value = !!(open && asset_uuid)  && route.name == 'assets.list';
    }
);

// 3. Watch modal state and write to URL (replace to avoid history spam)
watch([selectedAssetUUID, isUpdateModalOpen], ([asset_uuid, open]) => {
    const next = { ...route.query };
    if (open && asset_uuid) {
        next.update = 'true';
        next.asset_uuid = asset_uuid;
    } else {
        delete next.update;
        delete next.asset_uuid;
    }
    router.replace({ query: next });
});

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