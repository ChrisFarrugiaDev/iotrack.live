<template>
    <div>
        <VTable class="mt-4" :table-col="tableCol" :table-data="tableData" :search="searchTerm" :per-page="25"
            v-model:page="currentPage" row-key="id" :selectable="true" :searchTerm="searchTerm"
            @update:page="currentPage = Number($emit)" @update:selectedKeys="selectedKeys = ($event as any)">
        </VTable>
    </div>
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

// state for showing modals
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);

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

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>