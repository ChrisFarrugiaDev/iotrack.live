import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AuthenticatedUser} from '@/types/authenticated.user.type';


export const useSettingsStore = defineStore('settingsStore', () => {

    // ---- State ------------------------------------------------------
    const mapsApiKey = ref<string | undefined>(undefined);      
    const authenticatedUser = ref<AuthenticatedUser>();

    // ---- Getters ----------------------------------------------------
    const getMapsApiKey = computed(() => {
        return mapsApiKey.value;
    });

    const getAuthenticatedUser = computed( ()=> authenticatedUser.value);


    // ---- Actions ----------------------------------------------------
    function setMapsApiKey(key: string | undefined) {
        mapsApiKey.value = key;
    }

    function setAuthenticatedUser(u: AuthenticatedUser) {
        authenticatedUser.value = u;
    }

    function clear() {
        mapsApiKey.value = undefined
    }

    // - Expose --------------------------------------------------------
    return {
        clear,
        getMapsApiKey,
        setMapsApiKey,
        getAuthenticatedUser,
        setAuthenticatedUser,
    };
});
