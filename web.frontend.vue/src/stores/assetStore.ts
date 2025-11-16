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
        if (assets.value == null) return [];
        let a = Object.values(assets.value);
        a = a.filter(a => {
            return a.devices.length && Object.keys(a.devices[0].last_telemetry).length
        })
        return a;
    })

    const uuidToIdMap = computed<Record<string, string>>(() => {
        const map: Record<string, string> = {};

        for (const id in assets.value) {
            const uuid = assets.value[id].uuid;
            map[uuid] = id;
        }

        return map;
    });


    const getGroupedAssets = computed(() => {
        // Object to store groupings: { [orgName]: TreeNode }
        const groupedAssets: Record<string, TreeNode> = {};
        const orgs = organisationStore.getOrganisationScope;

        if (!assets.value || !orgs) return groupedAssets;

        const assetsList = Object.values(assets.value);

        for (const asset of assetsList) {
            // Find the organisation for this asset
            const organisation = orgs[asset.organisation_id];
            if (!organisation) continue; // skip if no org (defensive)

            // Create org group node if not exists
            if (!(organisation.name in groupedAssets)) {
                groupedAssets[organisation.name] = {
                    label: organisation.name,
                    id: organisation.name,
                    children: []
                }
            }

            // Add asset as child node under its org
            groupedAssets[organisation.name]!.children!.push({
                label: asset.name,
                id: asset.id,
            });
        }
        return groupedAssets;
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
        getGroupedAssets,
    }
})
