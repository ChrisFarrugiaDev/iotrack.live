import { ref, computed } from 'vue'
import { defineStore } from 'pinia'


declare global {
    interface Window {
        GO_DOCKERIZED: boolean | undefined;
        GO_APP_URL: string;
        GO_API_PORT: string;
    }
}

export const useAppStore = defineStore('appStore', () => {

    // ---- State ------------------------------------------------------


    const appUrl = ref(window.GO_DOCKERIZED === true
        ? window.GO_APP_URL
        : import.meta.env.VITE_APP_URL
    );

    const apiPort = ref(window.GO_DOCKERIZED === true
        ? window.GO_API_PORT
        : import.meta.env.VITE_API_PORT
    );

    const shouldFetchAccessProfile = ref<boolean>(true);


    // ---- Getters ----------------------------------------------------

    const getAppUrl = computed(() => appUrl.value);
    const getApiPort = computed(() => apiPort.value);
    const getShouldFetchAccessProfile = computed(() => shouldFetchAccessProfile.value);


    // ---- Actions ----------------------------------------------------

    function setShouldFetchAccessProfile(val: boolean) {
        shouldFetchAccessProfile.value = val;
    }

    // - Expose --------------------------------------------------------
    return { getAppUrl, getApiPort, getShouldFetchAccessProfile, setShouldFetchAccessProfile };
});