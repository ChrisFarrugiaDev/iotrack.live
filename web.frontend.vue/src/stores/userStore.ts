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
    const usersOrganisations = ref<Record<string, string[]>>({});
    const usersAssets = ref<Record<string, string[]>>({});
    const usersDevices = ref<Record<string, string[]>>({});


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



    const getUserPermissionsById = computed(() => {
        return (userId: string): number[] => {
            return usersPermissions.value[userId] ?? [];
        };
    });
    const getUserOrganisationsById = computed(() => {
        return (userId: string): string[] => {
            return usersOrganisations.value[userId] ?? [];
        };
    });
    const getUserAssetsById = computed(() => {
        return (userId: string): string[] => {
            return usersAssets.value[userId] ?? [];
        };
    });
    const getUserDevicesById = computed(() => {
        return (userId: string): string[] => {
            return usersDevices.value[userId] ?? [];
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

    async function fetchUserOrganisations(userId: string) {

        
        try {
            const url = `${appStore.getAppUrl}/api/user/${userId}/organisations`;
            const res = await axios.get(url);

            const orgs: string[] = res.data?.data?.organisations ?? [];

            // cache by userId
            usersOrganisations.value[userId] = orgs;

            return orgs;

        } catch (err) {
            console.error('! userStore fetchUserOrganisations !\n', err);
            throw err;
        }
    }

    async function fetchUserAssets(userId: string) {
        try {
            const url = `${appStore.getAppUrl}/api/user/${userId}/assets`;
            const res = await axios.get(url);

            const assets: string[] = res.data?.data?.assets ?? [];

            // cache by userId
            usersAssets.value[userId] = assets;

            return assets;

        } catch (err) {
            console.error('! userStore fetchUserAssets !\n', err);
            throw err;
        }
    }

    async function fetchUserDevices(userId: string) {
        try {
            const url = `${appStore.getAppUrl}/api/user/${userId}/devices`;
            const res = await axios.get(url);

            const devices: string[] = res.data?.data?.devices ?? [];

            // cache by userId
            usersDevices.value[userId] = devices;

            return devices;

        } catch (err) {
            console.error('! userStore fetchUserDevices !\n', err);
            throw err;
        }
    }

    async function updateUser(userId: string, payload: Record<string, any>) {
        try {
            const url = `${appStore.getAppUrl}/api/user/${userId}`;

            const result = await axios.request({
                method: 'patch',
                url,
                data: payload,
            });

            return result;

        } catch (err) {
            console.error('! userStore updateUser !\n', err);
            throw err;
        }
    }

    function setUserPermissions(userId: string, permissions: number[]) {
        usersPermissions.value[userId] = permissions;
    }

    function setUserOrganisations(userId: string, organisations: string[]) {
        usersOrganisations.value[userId] = organisations;
    }

    function setUserAssets(userId: string, assets: string[]) {
        usersAssets.value[userId] = assets;
    }

    function setUserDevices(userId: string, devices: string[]) {
        usersDevices.value[userId] = devices;
    }

    function setUserAccessState(
    userId: string,
    payload: {
        user_permissions?: number[];
        organisations?: string[];
        assets?: string[];
        devices?: string[];
    }
    ) {
        if (payload.user_permissions) {
            usersPermissions.value[userId] = payload.user_permissions;
        }
        if (payload.organisations) {
            usersOrganisations.value[userId] = payload.organisations;
        }
        if (payload.assets) {
            usersAssets.value[userId] = payload.assets;
        }
        if (payload.devices) {
            usersDevices.value[userId] = payload.devices;
        }
    }
    


    // ---- Expose -----------------------------------------------------
    return {

        // state getters
        getUserScope,
        getUserScopeByUuid,

        getUserPermissionsById,
        getUserOrganisationsById,
        getUserAssetsById,
        getUserDevicesById,

        // actions
        fetchUserScope,
        fetchUserPermissions,

        fetchUserOrganisations,
        fetchUserAssets,
        fetchUserDevices,

        createUser,
        deleteUsers,
        updateUser,

        addUserToStore,
        removeUserFromStore,

        hasUserPermission,

        // utils
        setUserScope,
        clear,

        setUserAccessState,
    }
});
