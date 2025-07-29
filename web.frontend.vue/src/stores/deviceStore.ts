import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Device } from '@/types/device';

export const useDeviceStore = defineStore('deviceStore', () => {

    // ---- State ------------------------------------------------------

    const devices = ref<Record<string, Device> | null>(null);


    // ---- Getters ----------------------------------------------------

    const getDevices = computed(() => devices.value);

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
    };
});