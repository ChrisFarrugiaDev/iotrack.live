import { ref, computed } from 'vue'
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


    const uuidToIdMap = computed<Record<string, string>>(() => {
        const map: Record<string, string> = {};

        for (const id in devices.value) {
            const uuid = devices.value[id].uuid;
            map[uuid] = id;
        }

        return map;
    });

    // ---- Actions ----------------------------------------------------

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

    function clear() {
        devices.value = null
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




    // - Expose --------------------------------------------------------
    return {
        getDevices,
        setDevices,
        clear,
        uuidToIdMap,
        createDevice,
        deleteDevices,
        addDeviceToStore,
        removeDeviceFromStore , 
        updatedDevice,

    };
});