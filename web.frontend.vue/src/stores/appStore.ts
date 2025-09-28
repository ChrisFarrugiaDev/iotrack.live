import { ref, computed } from 'vue'
import { defineStore } from 'pinia'


declare global {
    interface Window {
        GO_DOCKERIZED: boolean | undefined;
        GO_APP_URL: string;
        GO_API_PORT: string;
        GO_FILE_PORT: string;
        GO_SIO_PORT: string;
    }
}

export const useAppStore = defineStore('appStore', () => {

    // ---- State ------------------------------------------------------


    const appUrl = ref(window.GO_DOCKERIZED === true
        ? window.GO_APP_URL
        : import.meta.env.VITE_APP_URL
    );

    // const apiPort = ref(window.GO_DOCKERIZED === true
    //     ? window.GO_API_PORT
    //     : import.meta.env.VITE_API_PORT
    // );

    // const filePort = ref(window.GO_DOCKERIZED === true
    //     ? window.GO_FILE_PORT
    //     : import.meta.env.VITE_FILE_PORT
    // );

    // const socketioPort = ref(window.GO_DOCKERIZED === true
    //     ? window.GO_SIO_PORT
    //     : import.meta.env.VITE_SIO_PORT
    // );





    const shouldFetchAccessProfile = ref<boolean>(true);


    // ---- Getters ----------------------------------------------------

    const getAppUrl = computed(() => appUrl.value);

    const getShouldFetchAccessProfile = computed(() => shouldFetchAccessProfile.value);


    // ---- Actions ----------------------------------------------------

    function setShouldFetchAccessProfile(val: boolean) {
        shouldFetchAccessProfile.value = val;
    }

    // - Expose --------------------------------------------------------
    return {
        getAppUrl,

        getShouldFetchAccessProfile,
        setShouldFetchAccessProfile,

    };
});