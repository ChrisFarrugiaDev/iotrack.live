<template>
    <div>
        <div class="mt-16 flex">
            <VSearch v-model="searchTerm" :clearable="true" placeholder="Search…" :debounce="150" />
            <VIconButton class="mr-2" type="red" icon="icon-delete" @click="showDeleteDeviceModal" />
        </div>

        <VTable class="mt-4" :table-col="tableCol" :table-data="tableData" :search="searchTerm" :per-page="25"
            v-model:page="currentPage" row-key="id" :selectable="true" :searchTerm="searchTerm"
            @update:page="currentPage = Number($emit)" @update:selectedKeys="selectedKeys = ($event as any)">

            <template #pagination="{ page, pageCount, setPage }">
                <ThePager class="justify-center w-100" :page="page" :page-count="pageCount" :set-page="setPage" />
            </template>

            <template #actions="{ row }">
                <div>
                    <!-- <RouterLink :to="`/devices/${row.id}`" class="t-btns__btn" v-tooltip="{ content: 'View' }"
                        aria-label="View device">
                        <svg class="t-btns__icon">
                            <use xlink:href="@/ui/svg/sprite.svg#icon-view-more" />
                        </svg>
                    </RouterLink> -->
                    <VIconButton icon="icon-view-more" @click="isEditModalOpen = true" />
                </div>

            </template>
        </VTable>

    </div>
    <VModal v-model="isEditModalOpen" title="Device Info" size="xl">
        <DeviceEditView ref="deviceEditRef"></DeviceEditView>

        <template #footer>
            <button class="vbtn vbtn--zinc-lt" @click="isEditModalOpen = false">Cancel</button>
            <button class="vbtn vbtn--sky" @click="onSave">Save</button>
        </template>
    </VModal>

    <VModal v-model="isDeleteModalOpen" title="Delete Confirmation" size="xs">
        <div class="delete-modal">
            <svg class="delete-modal__icon">
                <use xlink:href="@/ui/svg/sprite.svg#icon-close" />
            </svg>
            <p v-if="selectedKeys.length === 1" class="delete-modal__text">Do you really want to delete this device?</p>
            <p v-else class="delete-modal__text">Do you really want to delete these devices?</p>
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
import { computed, onMounted, ref, toRaw, watch } from 'vue';
import DeviceEditView from './DeviceEditView.vue';
import { useMessageStore } from '@/stores/messageStore';

// - Store -------------------------------------------------------------
const deviceStore = useDeviceStore();
const { getDevices } = storeToRefs(deviceStore);

const assetStore = useAssetStore();
const { getAssets } = storeToRefs(assetStore);

const organisationStore = useOrganisationStore();
const { getOrganisationScope } = storeToRefs(organisationStore);

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



// - Computed ----------------------------------------------------------

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

// - methods -----------------------------------------------------------
const deviceEditRef = ref<InstanceType<typeof DeviceEditView>>();
function onSave() {
    deviceEditRef.value?.updateDevice();
}

function showDeleteDeviceModal() {
    if (selectedKeys.value.length === 0) {
        messageStore.setFlashMessagesList(["No device selected. Select a device to proceed with delete."], "flash-message--red", 2)
    } else {
        isDeleteModalOpen.value = true;
    }
}

function deleteDevices () {
    console.log(selectedKeys.value);
    isDeleteModalOpen.value = false;
}

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

.vue-custom-select {
    position: relative;
    --vs-padding: 1.9rem 0.5rem 0.5rem 0.5rem;
    --vs-background-color: var(--color-zinc-100);
    --vs-text-color: var(--color-text-1);
    --vs-border: 1px solid var(--color-zinc-300);
    --vs-border-radius: var(--radius-md, 0.375rem);
    --vs-font-weight: 300;
    --vs-font-size: 1rem;
    --vs-font-family: var(--font-action);
    --vs-outline-width: 0;
    --vs-outline-color: none;
    --vs-outline-color: var(--color-blue-500);
    --vs-menu-z-index: 2000;
}
</style>