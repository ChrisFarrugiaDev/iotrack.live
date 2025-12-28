import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Asset } from '@/types/asset.type'
import { useAppStore } from './appStore';
import axios from '@/axios';
import { useDeviceStore } from './deviceStore';
import { useOrganisationStore } from './organisationStore';

export const useAssetStore = defineStore('assetStore', () => {

    const appStore = useAppStore();
    const deviceStore = useDeviceStore();
    const organisationStore = useOrganisationStore();

    // ---- Types ------------------------------------------------------

    type TreeNode = {
        id: number | string
        label: string
        children?: TreeNode[]
    }

    // ---- State ------------------------------------------------------
    const assets = ref<Record<string, Asset> | null>(null);

    // ---- Getters ----------------------------------------------------
    const getAssets = computed(() => assets.value);


    const getAssetsWithDevice = computed(() => {
    if (!assets.value) return [];

    return Object.values(assets.value)
        .filter(asset =>
        asset?.devices?.length &&
        asset.devices[0]?.last_telemetry &&
        Object.keys(asset.devices[0].last_telemetry).length > 0
        );
    });

    const uuidToIdMap = computed<Record<string, string>>(() => {
        const map: Record<string, string> = {};

        for (const id in assets.value) {
            const uuid = assets.value[id].uuid;
            map[uuid] = id;
        }

        return map;
    });

    // ---- Actions ----------------------------------------------------
    function setAssets(payload: Record<string, Asset>) {
        assets.value = payload;
    }

    function addAssetToStore(a: Asset) {
        if (!assets.value) assets.value = {};

        if (a.devices.length) {
            deviceStore.removeAssetToDeviceInStore(a.devices[0].id);
            deviceStore.addAssetToDeviceInStore(a.devices[0].id, a.id)
        }
        assets.value[a.id] = a
    }

    function removeAssetFromStore(assetId: string | number) {
        if (!assets.value) return;

        if (assets.value[assetId].devices.length) {
            const device = deviceStore.useDevice(assets.value[assetId].devices[0].id);
            deviceStore.removeAssetToDeviceInStore(assets.value[assetId].devices[0].id);
        }

        if (assets.value[assetId]) {
            delete assets.value[assetId];
        }
    }

    async function createAsset(payload: Record<string, any>) {
        try {
            console.log(payload)

            const url = `${appStore.getAppUrl}/api/asset`;
            const result = await axios.post(url, payload);
            return result;

        } catch (err) {
            console.error('! assetStore createAsset !\n', err);
            throw err;
        }
    }

    async function deleteAssets(payload: { asset_ids: string[] }) {
        try {

            const url = `${appStore.getAppUrl}/api/asset`;
            return await axios.request({
                method: 'DELETE',
                url,
                data: payload, // ok to include a body on DELETE
                // headers not needed here; interceptor sets Authorization + Content-Type when data exists
            });
        } catch (err) {
            console.error('! assetStore deleteAssets !\n', err);
            throw err;
        }
    }

    async function updatedAsset(assetId: string | number, payload: Record<string, any>) {

        try {
            const url = `${appStore.getAppUrl}/api/asset/${assetId}`;
            return await axios.request({
                method: 'patch',
                url,
                data: payload,
            });
        } catch (err) {
            console.error('! assetStore updatedAsset !\n', err);
            throw err;
        }
    }

    function clear() {
        assets.value = null;
    }

    // ---- Expose -----------------------------------------------------
    return {
        getAssets,
        setAssets,
        uuidToIdMap,
        clear,
        createAsset,
        deleteAssets,
        updatedAsset,
        addAssetToStore,
        removeAssetFromStore,
        getAssetsWithDevice,
    }
})
