<template>
    <div>
        <VTable class="mt-4" :table-col="tableCol" :table-data="tableData" :search="searchTerm" :per-page="25"
            v-model:page="currentPage" row-key="id" :selectable="true" :searchTerm="searchTerm"
            @update:page="currentPage = Number($emit)" @update:selectedKeys="selectedKeys = ($event as any)">
            <template #actions="{ row }">          
                <VIconButton icon="icon-view-more" @click="showUpdateDeviceModal(row.uuid)"/>
            </template>
        </VTable>

    </div>

        <!-- Update Modal: opens device update form for selected device -->
    <VModal v-model="isUpdateModalOpen" size="xl">
        <template #header>
            <div class="vheading--2">Asset Details</div>
        </template>
        <AssetUpdateView :assets="getAssets" :selectedAssetUUID="selectedAssetUUID" :devices="getDevices" :organisations="getOrganisationScope" />
    </VModal>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useAssetStore } from '@/stores/assetStore';
import { useMessageStore } from '@/stores/messageStore';
import { useOrganisationStore } from '@/stores/organisationStore';
import type { TableColumn } from '@/types/table.column.type';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { VSearch, ThePager, VTable, VIconButton, VModal } from '@/ui';
import { useDeviceStore } from '@/stores/deviceStore';
import AssetUpdateView from './AssetUpdateView.vue';


// - Store -------------------------------------------------------------
const assetStore = useAssetStore();
const { getAssets } = storeToRefs(assetStore);

const organisationStore = useOrganisationStore();
const { getOrganisationScope } = storeToRefs(organisationStore);

const deviceStore = useDeviceStore();
const { getDevices } = storeToRefs(deviceStore);

const messageStore = useMessageStore();

// - Data --------------------------------------------------------------
// state for search & pagination
const searchTerm = ref("");
const currentPage = ref(1);
const selectedKeys = ref<string[]>([])

// Modal visibility state
const isUpdateModalOpen = ref(true);
const isDeleteModalOpen = ref(false);
const selectedAssetUUID = ref<string | null>(null);

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
        anchor: { enabled: true, urlKey: "organisation_url", target: "_blank" }
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
        anchor: {enabled: true, urlKey: "tracking_device_url"}
    },
        {
        col: "Created At",
        data: "created_at",
        sort: true,
        format: (value) => new Date(value).toLocaleString(),
        align: "left"
    }


]);



// - Computed ----------------------------------------------------------

const tableData = computed(() => {
    const assets = Object.values(getAssets.value || {});

    const devices = getDevices.value || {};
    
    const organisations = getOrganisationScope.value || {};

    return assets.map((a) => {

        const organisation = a.organisation_id ? organisations[a.organisation_id]?.name : null;
        

        const tracking_device = devices[a.devices[0]];

        return {
            ...a,
            
            organisation: organisation || null,
            organisation_url: a.organisation_id ? `/organisations/${a.organisation_id}` : null,

            tracking_device : tracking_device?.external_id || null,
            tracking_device_url: tracking_device ? `/devices?update=true&uuid=${tracking_device.uuid}` : null,

            created_at: a.created_at ? new Date(a.created_at) : null,
        };
    });
});

// Show update modal for selected device (skip if already open on same device)
function showUpdateDeviceModal(id: string) {
    if (id === selectedAssetUUID.value) return;
    isUpdateModalOpen.value = true;
    selectedAssetUUID.value = id;
}
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>