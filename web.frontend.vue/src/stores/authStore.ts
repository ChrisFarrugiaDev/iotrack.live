import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage, useSessionStorage } from '@vueuse/core';

export const useAuthStore = defineStore('authStore', () => {

    // ---- State ------------------------------------------------------

    const rememberMe = useLocalStorage<boolean>("remember-me", false);
    const jwtStorage = rememberMe.value ? useLocalStorage<string | null>("jwt", null) : useSessionStorage<string | null>("jwt", null);

    const jwt = computed({
        get: () => jwtStorage.value,
        set: (val: string | null) => jwtStorage.value = val
    });  

    const redirectTo = ref("mapView");   

    // ---- Getters ----------------------------------------------------

    const isAuthenticated = computed(() => {
        return Boolean(jwt.value);           
    });

    const getJwt = computed(()=>{
        return jwt.value;
    });

    const getRemeberMe = computed(()=>{
        return rememberMe.value;
    });

    const getRedirectTo = computed(()=>{
        return redirectTo.value;
    });

    // ---- Actions ----------------------------------------------------

    function setJwt(token: string | null) {    
        console.log(token)    
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
    };
})
