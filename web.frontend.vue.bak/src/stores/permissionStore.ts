import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const usePermissionStore = defineStore('permissionStore', () => {

    // ---- State ------------------------------------------------------
    const roles = ref<Record<string, string>>({})


    // ---- Getters ----------------------------------------------------
    const getRoles = computed(() => roles.value);


    // ---- Actions ----------------------------------------------------

    function setRoles(r: Record<string, string>) {
        roles.value = r;
    }


    // - Expose --------------------------------------------------------
    return {
        getRoles,
        setRoles,
    };
});
