import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAssetStore } from './assetStore';
import { useAuthorizationStore } from './authorizationStore';
import { useDeviceStore } from './deviceStore';
import { useFilterStore } from './filterStore';
import { useGroupStore } from './groupStore';
import { useImageStore } from './imageStore';
import { useMapStore } from './mapStore';
import { useOrganisationStore } from './organisationStore';
import { useSettingsStore } from './settingsStore';
import { useUserAssignableStore } from './userAssignableStore';
import { useUserStore } from './userStore';


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

    function clearOrgScopedStores() {
        useAssetStore().clear();
        useAuthorizationStore().clear();
        useDeviceStore().clear();
        useFilterStore().clear();
        useGroupStore().clear();
        useImageStore().clear();
        useMapStore().clear();
        useOrganisationStore().clear();
        useSettingsStore().clear();
        useUserAssignableStore().clear();
        useUserStore().clear();
    }

    // - Expose --------------------------------------------------------
    return {
        clearOrgScopedStores,
        getAppUrl,

        getShouldFetchAccessProfile,
        setShouldFetchAccessProfile,

    };
});