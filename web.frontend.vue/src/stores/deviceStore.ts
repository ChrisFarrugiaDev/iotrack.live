import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Device } from '@/types/device.type';

export const useDeviceStore = defineStore('deviceStore', () => {

    // ---- State ------------------------------------------------------

    const devices = ref<Record<string, Device> | null>(null);


    // ---- Getters ----------------------------------------------------

    const getDevices = computed(() => devices.value);
    const getUUID_2_ID = computed(() => {
        const UUID_2_ID: Record<string, string> = {};
        for (const  id in devices.value) {
            const  uuid  = devices.value[id].uuid;
            UUID_2_ID[uuid] = id;
        }
        return UUID_2_ID;
    })

    // ---- Actions ----------------------------------------------------

    function setDevices(payload: Record<string, Device>) {
        devices.value = payload
    }

    function clear() {
        devices.value = null
    }

    // - Expose --------------------------------------------------------
    return {
        getDevices, 
        setDevices,
        clear,
        getUUID_2_ID,
    };
});