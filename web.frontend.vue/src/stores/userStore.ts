import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from '@/axios';
import { useAppStore } from './appStore';
import type { User } from '@/types/user.type';

export const useUserStore = defineStore('userStore', () => {

    // ---- Store ------------------------------------------------------

    const appStore = useAppStore();

    // ---- State ------------------------------------------------------

    const userScope = ref<Record<string, User> | null>(null);


    // ---- Getters ----------------------------------------------------

    const getUserScope = computed(() => userScope.value)

    // ---- Setters (Actions) ------------------------------------------

    async function createUser(payload: Record<string, any>) {
        try {
            const url = `${appStore.getAppUrl}/api/user`;
            const result = await axios.post(url, payload);
            return result;

        } catch (err) {
            console.error('! userStore createUser !\n', err);
            throw err;
        }
    }

    async function fetchUserScope() {

        try {
            const url = `${appStore.getAppUrl}/api/user`;
            const res = await axios.get(url);
            return res;

        } catch (err) {
            console.error('! userStore fetchUserScope !\n', err);
            throw err;
        }
    }

    function setUserScope(val: Record<string, any> | null) {
        userScope.value = val
    }

    function clear() {
        userScope.value = null;
    }

    // ---- Expose -----------------------------------------------------
    return {  

        getUserScope,
        setUserScope,  
        fetchUserScope,

        createUser,
        
        clear,
    }
});
