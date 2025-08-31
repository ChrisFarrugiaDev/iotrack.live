import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Device } from '@/types/device.type';

export const useDeviceStore = defineStore('deviceStore', () => {

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

    function clear() {
        devices.value = null
    }

    // - Expose --------------------------------------------------------
    return {
        getDevices,
        setDevices,
        clear,
        uuidToIdMap,
    };
});