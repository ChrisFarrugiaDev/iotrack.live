<template>
    <form class="vform mt-16" autocomplete="off">
        <TheFlashMessage></TheFlashMessage>

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
    </form>

  
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';
import { useFormErrorHandler } from '@/composables/useFormErrorHandler';

import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";
import { useMessageStore } from '@/stores/messageStore';
import { useOrganisationStore } from '@/stores/organisationStore';
import { computed, reactive, ref, watch } from 'vue';


// - Composable --------------------------------------------------------

const vueSelectStyles = useVueSelectStyles();

const errors = ref<Record<string, string>>({
    name: '',
    parent_org_id: '',
    can_inherit_key: '',
    maps_api_key: '',
});

const {handleFormError} = useFormErrorHandler(errors);

// - Props -------------------------------------------------------------

const props = defineProps<{
    organisationUuid?: string | null;
}>();

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

// - Watchers ----------------------------------------------------------
watch([() => props.organisationUuid, uuidToIdMap], ()=>{

})

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>