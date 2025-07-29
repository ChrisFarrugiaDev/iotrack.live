import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useOrganisationStore = defineStore('organisationStore', () => {

    // ---- State ------------------------------------------------------

    const organisation = ref<Record<string, string> | null>(null)
    const organisationScope = ref<Record<string, any> | null>(null)

    // ---- Getters ----------------------------------------------------

    const getOrganisation = computed(() => organisation.value)
    const getOrganisationScope = computed(() => organisationScope.value)

    // ---- Setters (Actions) ------------------------------------------

    function setOrganisation(val: Record<string, string> | null) {
        organisation.value = val
    }
    function setOrganisationScope(val: Record<string, any> | null) {
        organisationScope.value = val
    }

    function clear() {
        organisation.value = null;
        organisationScope.value = null;
    }

    // ---- Expose -----------------------------------------------------
    return {
     
        getOrganisation,
        setOrganisation,

        getOrganisationScope,
        setOrganisationScope,  
        
        clear,
    }
});
