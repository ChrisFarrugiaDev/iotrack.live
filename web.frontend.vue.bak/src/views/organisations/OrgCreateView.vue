<template>
    <form class="vform mt-16" autocomplete="off" @click="clearMessage">

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group mb-7">
                <label class="vform__label" for="device_id">Name <span class="vform__required">*</span></label>
                <input v-model.trim="form.name" :class="{ 'vform__input--error': errors.name }" class="vform__input"
                    id="device_id" type="text" placeholder="Enter organisation name" :disabled="confirmOn">
                <p class="vform__error">{{ errors.name }}</p>
            </div>

            <div class="vform__group mb-7">
                <label class="vform__label" for="parent_org_id">Parent Organisation<span
                        class="vform__required">*</span></label>
                <VueSelect v-model="form.parent_org_id" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                    class="vform__group" :style="[vueSelectStyles, selectErrorStyle(!!errors.parent_org_id)]"
                    :options="getOrganisations" placeholder="" id="parent_org_id" />
                <p class="vform__error">{{ errors.parent_org_id }}</p>
            </div>
        </div>

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

            <div class="vform__group mb-7">
                <label class="vform__label">Can inherit Maps API key<span class="vform__required">*</span></label>
                <VueSelect v-model="form.can_inherit_key" class="vform__group"
                    :shouldAutofocusOption="false" 
                    :isDisabled="confirmOn" 
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.status)]"  
                    :options="[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false },
                    ]" placeholder="" />
                <p class="vform__error">{{ errors.status }}</p>
            </div>

            <div class="vform__group mb-7">
                <label class="vform__label" for="device_id">Maps Api key </label>
                <input v-model.trim="form.maps_api_key" :class="{ 'vform__input--error': errors.maps_api_key }" class="vform__input"
                    id="device_id" type="text" 
                      :placeholder="form.can_inherit_key ? 'Leave blank to inherit from parent' : 'Enter Maps API key'"
                    :disabled="confirmOn">
                <p class="vform__error">{{ errors.maps_api_key }}</p>
            </div>


		</div>


        <div class="vform__row mt-9 ">
			<button v-if="!confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="initCreateOrganisation">Register Organisation</button>
			<button v-if="confirmOn" class="vbtn vbtn--zinc-lt mt-3" @click.prevent="confirmOn = false">Cancel</button>
			<button v-if="confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="createOrganisation">Confirm</button>
		</div>

    </form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import { useMessageStore } from '@/stores/messageStore';
import { computed, reactive, ref, watch } from 'vue';
import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";
import { useOrganisationStore } from "@/stores/organisationStore";
import { useFormErrorHandler } from "@/composables/useFormErrorHandler";


// - Composable --------------------------------------------------------

const vueSelectStyles = useVueSelectStyles();

const errors = ref<Record<string, string>>({
    name: '',
    parent_org_id: '',
    can_inherit_key: '',
    maps_api_key: '',
});

const {handleFormError} = useFormErrorHandler(errors);

// - Store -------------------------------------------------------------

const messageStore = useMessageStore();
const organisationStore = useOrganisationStore();

// - Data --------------------------------------------------------------

const confirmOn = ref(false);

const form = reactive({
    name: null as null | string,
    parent_org_id: null as null | string,
    can_inherit_key: true,
    maps_api_key: null as null | string,
});

// - Computed ----------------------------------------------------------

const getOrganisations = computed(() => {
    const orgs = organisationStore.getOrganisationScope || {};

    return Object.values(orgs).map((o: any) => ({
        label: o.name,
        value: o.id,
    }));
});

// - Watch -------------------------------------------------------------

watch(()=>organisationStore.getOrganisation, (org) => {    
	form.parent_org_id = org?.id ?? null;
}, {
	immediate: true,
	deep: true
});

// - Methods -----------------------------------------------------------

function clearMessage() {
    messageStore.clearFlashMessageList();
}


function initCreateOrganisation() {
    confirmOn.value = true;
    
    errors.value = {
        name: '',
        can_inherit_key: '',
        maps_api_key: '',
    };
}

async function createOrganisation() {
    
    try {      

      
        const payload: Record<string, any> = { ...form };

        if (!form.maps_api_key || form.maps_api_key.trim().length == 0) {
            delete payload.maps_api_key;
        }
    
        const r = await organisationStore.createOrganisation(payload);

        console.log(r)
        
    } catch (err) {

		handleFormError(err);
		console.error("! UserCreateView createUser !", err);
        
    } finally {
        confirmOn.value = false;
    }
}


</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>