import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Group } from '@/types/group.type';
import { useAppStore } from './appStore';
import axios from '@/axios';

export const useGroupStore = defineStore('groupStore', () => {

    const appStore = useAppStore();

    // ---- State ------------------------------------------------------
    const groups = ref<Record<string, Group> | null>(null);


    // ---- Getters ----------------------------------------------------

    const getGroups = computed(() => groups.value);

    const uuidToIdMap = computed<Record<string, string>>(() => {
        const map: Record<string, string> = {};

        for (const id in groups.value) {
            const uuid = groups.value[id].uuid;
            map[uuid] = id;
        }

        return map;
    });

    // ---- Actions ----------------------------------------------------

    function setGroups(payload: Record<string, Group>) {
        groups.value = payload;
    }

    function addGroupToStore(g: Group) {
        if (!groups.value) groups.value = {};

        groups.value[g.id] = g;
    }

    function removeAssetFromStore(groupId: string | number) {
        if (!groups.value) return;

        if (groups.value[groupId]) {
            delete groups.value[groupId];
        }
    }

    async function createGroup(payload: Record<string, string | null>) {
        try {
            const url = `${appStore.getAppUrl}/api/group`;
            const result = await axios.post(url, payload);
            return result;
        } catch (err) {
            console.error('! groupStore createGroup !\n', err);
            throw err;
        }
    }

    async function deleteGroup(payload: { group_ids: string[] }) {
        try {

            const url = `${appStore.getAppUrl}/api/group`;
            return await axios.request({
                method: 'DELETE',
                url,
                data: payload, // ok to include a body on DELETE
                // headers not needed here; interceptor sets Authorization + Content-Type when data exists
            });
        } catch (err) {
            console.error('! groupStore deleteGroups !\n', err);
            throw err;
        }
    }

    // - Expose --------------------------------------------------------
    return {
        getGroups,
        setGroups,
        addGroupToStore,
        removeAssetFromStore,
        createGroup,
        deleteGroup,
        uuidToIdMap,
    };
});
