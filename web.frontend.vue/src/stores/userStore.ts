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
    const usersPermissions = ref<Record<string, number[]>>({});


    // ---- Getters ----------------------------------------------------

    const getUserScope = computed(() => userScope.value);

    const getUserScopeByUuid = computed(() => {

        const uu: typeof userScope.value = {};

        for (let id in userScope.value) {
            const uuid = userScope.value[id].uuid;
            uu[uuid] = userScope.value[id]
        }

        return uu;
    });

    const getUsersPermissions = computed(() => { return usersPermissions.value });

    const getUserPermissionsById = computed(() => {
        return (userId: string): number[] => {
            return usersPermissions.value[userId] ?? [];
        };
    });

    // ---- Setters (Actions) ------------------------------------------


    function addUserToStore(user: User) {
        if (!userScope.value) return;
        userScope.value[user.id] = user;
    }

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

    function removeUserFromStore(userId: string | number) {
        if (!userScope.value) return;
        if (userScope.value[userId]) {
            delete userScope.value[userId];
        }
    }

    async function deleteUsers(payload: { user_ids: string[] }) {
        

        try {
            const url = `${appStore.getAppUrl}/api/user`;
            return await axios.request({
                method: 'DELETE',
                url,
                data: payload, // ok to include a body on DELETE
                // headers not needed here; interceptor sets Authorization + Content-Type when data exists
            });
        } catch (err) {
            console.error('! userStore deleteUsers !\n', err);
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


    async function fetchUserPermissions(userId: string) {

        try {
            const url = `${appStore.getAppUrl}/api/user/${userId}/permissions`;
            const res = await axios.get(url);

            const perms: number[] = res.data?.data?.user_permissions ?? [];

            // cache by userId
            usersPermissions.value[userId] = perms;

            return perms;

        } catch (err) {
            console.error('! userStore fetchUserPermissions !\n', err);
            throw err;
        }
    }


    function hasUserPermission(userId: string, permId: number): boolean {
        return usersPermissions.value[userId]?.includes(permId) ?? false;
    }

    // ---- Expose -----------------------------------------------------
    return {

        // state getters
        getUserScope,
        getUserScopeByUuid,

        getUsersPermissions,
        getUserPermissionsById,

        // actions
        fetchUserScope,
        fetchUserPermissions,

        createUser,
        deleteUsers,

        addUserToStore,
        removeUserFromStore,

        hasUserPermission,

        // utils
        setUserScope,
        clear,
    }
});
