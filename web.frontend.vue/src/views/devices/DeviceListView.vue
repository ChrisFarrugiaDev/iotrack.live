<template>
    <div>

        <TheTable  
        class="mt-12"      
            :tableCol="tableCol"
            :tableData="tableData"
            :searchable="true"
        ></TheTable>
        <p v-if="!tableData.length" class="mt-4 text-muted">No devices found.</p>

    </div>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import TheTable from '@/components/commen/TheTable.vue';
import { useAssetStore } from '@/stores/assetStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { useOrganisationStore } from '@/stores/organisationStore';
import type { TableColumn } from '@/types/table.column.type';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, toRaw, watch } from 'vue';

// - Store -------------------------------------------------------------
const deviceStore = useDeviceStore();
const { getDevices } = storeToRefs(deviceStore);

const assetStore = useAssetStore();
const { getAssets } = storeToRefs(assetStore);

const organisationStore = useOrganisationStore();
const { getOrganisationScope } = storeToRefs(organisationStore);

// - Computed ----------------------------------------------------------
/*

*/
const tableData = computed(() => {
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


const tableCol = ref<TableColumn[]>([
    {
        col: "ID",
        data: "id",
        sort: true,
        align: "center"
    },
    {
        col: "Organisation",
        data: "organisation",
        sort: true,
        searchable: true,
        anchor: { enabled: true, urlKey: "organisation_url", target: "_blank" }
    },
    {
        col: "Asset",
        data: "asset",
        sort: true,
        searchable: true,
        anchor: { enabled: true, urlKey: "asset_url", target: "_blank" }
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
        searchable: true
    },
    {
        col: "Model",
        data: "model",
        searchable: true
    },
    {
        col: "Protocol",
        data: "protocol",
        searchable: true
    },
    {
        col: "Status",
        data: "status",
        sort: true,
        align: "left"
    },
    {
        col: "Created At",
        data: "created_at",
        sort: true,
        format: (value) => new Date(value).toLocaleString(),
        align: "left"
    }
]);





</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss"></style>