import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AuthenticatedUser} from '@/types/authenticated.user.type';


export const useSettingsStore = defineStore('settingsStore', () => {

    // ---- State ------------------------------------------------------
    const mapsApiKey = ref<string | undefined>(undefined);
    const aiApiKey = ref<string | undefined>(undefined);
    const authenticatedUser = ref<AuthenticatedUser>();

    // ---- Getters ----------------------------------------------------
    const getMapsApiKey = computed(() => mapsApiKey.value);
    const getAiApiKey = computed(() => aiApiKey.value);

    const getAuthenticatedUser = computed( ()=> authenticatedUser.value);

    const isRoot = computed(() => {
        if (authenticatedUser.value?.role?.id === 1) {
            return true
        }

        return false;
    })
    
    // ---- Actions ----------------------------------------------------
    function setMapsApiKey(key: string | undefined) {
        mapsApiKey.value = key;
    }

    function setAiApiKey(key: string | undefined) {
        aiApiKey.value = key;
    }

    function setAuthenticatedUser(u: AuthenticatedUser) {
        authenticatedUser.value = u;
    }

    function clear() {
        mapsApiKey.value = undefined;
        aiApiKey.value = undefined;
        authenticatedUser.value = undefined;
    }

    // - Expose --------------------------------------------------------
    return {
        clear,
        getMapsApiKey,
        setMapsApiKey,
        getAiApiKey,
        setAiApiKey,
        getAuthenticatedUser,
        setAuthenticatedUser,

        isRoot,

    };
});
