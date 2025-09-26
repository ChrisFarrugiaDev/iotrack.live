import { ref, computed, toRaw } from 'vue'
import { defineStore } from 'pinia'
import type { Device } from '@/types/device.type';
import axios from '@/axios';
import { useAppStore } from './appStore';

export const useDeviceStore = defineStore('deviceStore', () => {

    const appStore = useAppStore();

    // ---- State ------------------------------------------------------

    const devices = ref<Record<string, Device> | null>(null);


    // ---- Getters ----------------------------------------------------

    const getDevices = computed(() => devices.value);

    // Getter for a single device by id
    function useDevice(id: string) {
        return computed(() => devices.value?.[id] ?? null);
    }



    const uuidToIdMap = computed<Record<string, string>>(() => {
        const map: Record<string, string> = {};

        for (const id in devices.value) {
            const uuid = devices.value[id].uuid;
            map[uuid] = id;
        }

        return map;
    });

    // ---- Actions ----------------------------------------------------

    function clear() {
        devices.value = null
    }

    function setDevices(payload: Record<string, Device>) {
        devices.value = payload
    }

    function addDeviceToStore(d: Device) {
        if (!devices.value) devices.value = {};
        devices.value[d.id] = d
    }

    function removeDeviceFromStore(deviceId: string | number) {
        if (!devices.value) return;
        if (devices.value[deviceId]) {
            delete devices.value[deviceId];
        }
    }

    function addAssetToDeviceInStore(deviceId: string | number, assetId: string | number) {
        if (!devices.value) return;
        const device = devices.value[deviceId];
        if (device) {
            device.asset_id = String(assetId);
        }
    }

    function removeAssetToDeviceInStore(deviceId: string | number) {
        if (!devices.value) return;
        const device = devices.value[deviceId];
        if (device) {
            device.asset_id = null;
        }
    }

    function changeDeviceAssetID(deviceID: string, assetID: string | null) {
        const device = devices.value?.[deviceID];
        if (!device) return;
        device.asset_id = assetID ?? null;
    }

    function changeDeviceOrganisationID(deviceID: string, organisationID: string) {
        const device = devices.value?.[deviceID];

        if (!device) return;
        device.organisation_id = organisationID;
    }

    async function createDevice(payload: Record<string, any>) {
        try {
            const url = `${appStore.getAppUrl}:${appStore.getApiPort}/api/device`;
            const result = await axios.post(url, payload);
            return result;

        } catch (err) {
            console.error('! deviceStore createDevice !\n', err);
            throw err;
        }
    }


    async function deleteDevices(payload: { device_ids: string[] }) {
        try {
            const url = `${appStore.getAppUrl}:${appStore.getApiPort}/api/device`;
            return await axios.request({
                method: 'DELETE',
                url,
                data: payload, // ok to include a body on DELETE
                // headers not needed here; interceptor sets Authorization + Content-Type when data exists
            });
        } catch (err) {
            console.error('! deviceStore deleteDevices !\n', err);
            throw err;
        }
    }

    async function updatedDevice(deviceId: string | number, payload: Record<string, any>) {
        try {
            const url = `${appStore.getAppUrl}:${appStore.getApiPort}/api/device/${deviceId}`;
            return await axios.request({
                method: 'patch',
                url,
                data: payload,

            });
        } catch (err) {
            console.error('! deviceStore updatedDevice !\n', err);
            throw err;
        }
    }



    function updateWithLiveData(data: any) {
        if (!devices.value) return;

        const dev = devices.value[data.device_id];
        if (!dev || !dev.last_telemetry) return;

        // console.log('Live data', data)

        // Update main telemetry fields
        dev.last_telemetry_ts = data.happened_at;
        
        const fields = [
            "latitude", "longitude", "altitude", "angle",
            "priority", "satellites", "speed", "timestamp"
        ];
        for (const f of fields) {
            dev.last_telemetry[f] = data.telemetry[f];
        }

        // Merge .elements (data first, then previous, so new values win)
        dev.last_telemetry.elements = {
            ...dev.last_telemetry.elements,
            ...data.telemetry.elements,
        };
    }


    // - Expose --------------------------------------------------------
    return {
        getDevices,
        setDevices,
        clear,
        uuidToIdMap,
        createDevice,
        deleteDevices,
        addDeviceToStore,
        removeDeviceFromStore,
        updatedDevice,
        changeDeviceAssetID,
        changeDeviceOrganisationID,
        updateWithLiveData,
        useDevice,
        addAssetToDeviceInStore,
        removeAssetToDeviceInStore,
    };
});