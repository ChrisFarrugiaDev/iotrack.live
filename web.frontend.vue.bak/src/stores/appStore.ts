import { ref, computed } from 'vue'
import { defineStore } from 'pinia'


declare global {
    interface Window {
        GO_DOCKERIZED: boolean | undefined;
        GO_APP_URL: string;
        GO_AUTH_PORT: string;
    }
}

export const useAppStore = defineStore('appStore', () => {

// ---- State ------------------------------------------------------


    const appUrl = ref( window.GO_DOCKERIZED === true
        ? window.GO_APP_URL 
        : import.meta.env.VITE_APP_URL
    );

    const authPort = ref( window.GO_DOCKERIZED === true
        ? window.GO_AUTH_PORT 
        : import.meta.env.VITE_APP_AUTH_PORT
    );


// ---- Getters ----------------------------------------------------
const getAppUrl = computed(() => appUrl.value);
const getAuthPort = computed(() => authPort.value);


// ---- Actions ----------------------------------------------------


// - Expose --------------------------------------------------------
return { getAppUrl, getAuthPort };
});