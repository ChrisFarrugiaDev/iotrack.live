import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useMapStore = defineStore('mapStore', () => {

    // ---- State ------------------------------------------------------
    const activeInfoWindow = ref<string | null>(null);


    // ---- Getters ----------------------------------------------------
    const getActiveInfoWindow = computed(() => {
        return activeInfoWindow.value;
    })


    // ---- Actions ----------------------------------------------------
    function setActiveInfoWindow (id: string | null)  {
        if (activeInfoWindow.value == id) {
            activeInfoWindow.value = null;
        } else {
            activeInfoWindow.value = id;
        }
    }

    // - Expose --------------------------------------------------------
    return {
        getActiveInfoWindow,
        setActiveInfoWindow
    };
});
