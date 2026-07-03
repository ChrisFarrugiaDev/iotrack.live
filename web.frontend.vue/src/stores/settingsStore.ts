import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AuthenticatedUser} from '@/types/authenticated.user.type';
import axios from '@/axios';
import { useAppStore } from './appStore';

export type WhiteLabelConfig = {
    app_title?: string | null;
    login_bg_url?: string | null;
    login_fg_url?: string | null;
    domain?: string | null;
};

export const useSettingsStore = defineStore('settingsStore', () => {

    const appStore = useAppStore();

    // ---- State ------------------------------------------------------
    const mapsApiKey = ref<string | undefined>(undefined);
    const aiApiKey = ref<string | undefined>(undefined);
    const whiteLabel = ref<WhiteLabelConfig | null>(null);
    const authenticatedUser = ref<AuthenticatedUser>();

    // ---- Getters ----------------------------------------------------
    const getMapsApiKey = computed(() => mapsApiKey.value);
    const getAiApiKey = computed(() => aiApiKey.value);
    const getWhiteLabel = computed(() => whiteLabel.value);

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

    function setWhiteLabel(config: WhiteLabelConfig | null) {
        whiteLabel.value = config;
    }

    // Public endpoint — used by the login screen before authentication
    async function fetchPublicWhiteLabel() {
        try {
            const url = `${appStore.getAppUrl}/api/white-label/public`;
            const response = await axios.get(url);
            whiteLabel.value = response.data?.data?.white_label ?? null;
        } catch (err) {
            // Never block the login screen on branding — fall back to defaults
            console.error('! settingsStore fetchPublicWhiteLabel !\n', err);
        }
    }

    function setAuthenticatedUser(u: AuthenticatedUser) {
        authenticatedUser.value = u;
    }

    function clear() {
        mapsApiKey.value = undefined;
        aiApiKey.value = undefined;
        whiteLabel.value = null;
        authenticatedUser.value = undefined;
    }

    // - Expose --------------------------------------------------------
    return {
        clear,
        getMapsApiKey,
        setMapsApiKey,
        getAiApiKey,
        setAiApiKey,
        getWhiteLabel,
        setWhiteLabel,
        fetchPublicWhiteLabel,
        getAuthenticatedUser,
        setAuthenticatedUser,

        isRoot,

    };
});
