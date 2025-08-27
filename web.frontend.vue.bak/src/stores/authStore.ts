import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage, useSessionStorage } from '@vueuse/core';

export const useAuthStore = defineStore('authStore', () => {

    // ---- State ------------------------------------------------------

    const rememberMe = useLocalStorage<boolean>("remember-me", false);
    const jwtLocal = useLocalStorage<string | null>("jwt", null);
    const jwtSession = useSessionStorage<string | null>("jwt", null);

    const jwt = computed({

        get: () => rememberMe.value ? jwtLocal.value : jwtSession.value,
        set: (val: string | null) => {
            if (rememberMe.value) {
                jwtLocal.value = val;
                jwtSession.value = null; // clear the other
            } else {
                jwtSession.value = val;
                jwtLocal.value = null; // clear the other
            }
        }
    });

    const redirectTo = ref("mapView");

    // ---- Getters ----------------------------------------------------

    const isAuthenticated = computed(() => {
        return Boolean(jwt.value);
    });

    const getJwt = computed(() => {

        return jwt.value;
    });

    const getRemeberMe = computed(() => {
        return rememberMe.value;
    });

    const getRedirectTo = computed(() => {
        return redirectTo.value;
    });

    // ---- Actions ----------------------------------------------------

    function setJwt(token: string | null) {
        jwt.value = token;
    }

    function clearJwt() {
        jwt.value = null;
    }

    function resetAuthStore() {
        jwt.value = null;
    }

    function setRedirectTo(payload: any) {
        redirectTo.value = payload.name;
    }

    function toggleRememberMe() {
        rememberMe.value = !rememberMe.value;
    }

    // - Log counter ---------------------------------------------------

    const logCounter = ref(0);

    const getLogCounter = computed(() => {
        return logCounter.value;
    })
    function updateLogCounter() {
        logCounter.value++;
    }

    // - Expose --------------------------------------------------------
    return {
        rememberMe,
        getJwt,
        resetAuthStore,
        isAuthenticated,

        setJwt,
        clearJwt,

        getRedirectTo,
        setRedirectTo,

        getRemeberMe,
        toggleRememberMe,

        getLogCounter,
        updateLogCounter,
    };
})
