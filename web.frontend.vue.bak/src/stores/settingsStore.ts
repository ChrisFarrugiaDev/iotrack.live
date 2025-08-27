import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settingsStore', () => {

    // ---- State ------------------------------------------------------
    const mapsApiKey = ref<string | undefined>(undefined);

    // ---- Getters ----------------------------------------------------
    const getMapsApiKey = computed(() => {
        return mapsApiKey.value;
    });


    // ---- Actions ----------------------------------------------------
    function setMapsApiKey(key: string | undefined) {
        mapsApiKey.value = key;
    }

    function clear() {
        mapsApiKey.value = undefined
    }

    // - Expose --------------------------------------------------------
    return {
        clear,
        getMapsApiKey,
        setMapsApiKey
    };
});
