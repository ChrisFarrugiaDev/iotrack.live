import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Organisation } from '@/types/organisation.type';
import { useAppStore } from './appStore';
import axios from '@/axios';

export const useOrganisationStore = defineStore('organisationStore', () => {

    
    const appStore = useAppStore();

    // ---- State ------------------------------------------------------

    const organisation = ref<Record<string, string> | null>(null);
    const organisationScope = ref<Record<string, any> | null>(null);

    // ---- Getters ----------------------------------------------------

    const getOrganisation = computed(() => organisation.value);
    const getOrganisationScope = computed(() => organisationScope.value);

    const getChildrenIds = computed(() => {

        const parentOrg = organisation.value;

        const orgs = {...organisationScope.value};

        if (orgs && parentOrg) {
            delete orgs[parentOrg.id]
            return Object.keys(orgs);
            
        } else {
            return [];
        }
    });

    const getOrgScopeByUUID = computed(() => {
        const oo: Record<string, Organisation> = {};
        if (!getOrganisationScope.value!) return oo;
    

        for (let id in getOrganisationScope.value) {
            const uuid = getOrganisationScope.value[id].uuid
            oo[uuid] = getOrganisationScope.value[id]; 
        }

        return oo;
    });

    // ---- Setters (Actions) ------------------------------------------

    function setOrganisation(val: Record<string, string> | null) {
        organisation.value = val
    }

    function setOrganisationScope(val: Record<string, any> | null) {
        organisationScope.value = val
    }

    function addOrganisationToScope(org: Organisation) {
        if (!organisationScope.value ) return;
        organisationScope.value[org.id] = org;
    }

    async function createOrganisation(payload: Record<string, any>) {
        try {
            const url = `${appStore.getAppUrl}/api/organisation`;
            const result = await axios.post(url, payload);
            return result;
        } catch (err) {
            console.error('! organisationStore createOrganisation !\n', err);
            throw err;
        }
    }
    
    async function deleteOrganisations(payload: { organisation_ids: string[] }) {
        try {
            const url = `${appStore.getAppUrl}/api/organisation`;
            return await axios.request({
                method: 'DELETE',
                url,
                data: payload, // ok to include a body on DELETE
                // headers not needed here; interceptor sets Authorization + Content-Type when data exists
            });
        } catch (err) {
            console.error('! organisationStore deleteOrganisations !\n', err);
            throw err;
        }
    }

    async function updateOrganisation(orgId: string, payload: Record<string, any>) {
        try {
            const url = `${appStore.getAppUrl}/api/organisation/${orgId}`;
            return await axios.request({
                method: 'patch',
                url,
                data: payload,
            });
            
        } catch (err) {
            console.error('! organisationStore updateOrganisation !\n', err);
            throw err;
        }
    }

    function removeOrganisationFromStore(orgId: string | number) {
        if (!organisationScope.value) return;
        if (organisationScope.value[orgId]) {
            delete organisationScope.value[orgId];
        }
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
        addOrganisationToScope,
        removeOrganisationFromStore,
        getChildrenIds,

        createOrganisation,
        deleteOrganisations,
        updateOrganisation,
        getOrgScopeByUUID,

        clear,
    }
});
