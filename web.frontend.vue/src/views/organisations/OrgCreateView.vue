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

        </div>

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
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
import { useMessageStore } from '@/stores/messageStore';
import { reactive, ref } from 'vue';
import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";


// - Composable --------------------------------------------------------

const vueSelectStyles = useVueSelectStyles();

// - Store -------------------------------------------------------------

const messageStore = useMessageStore();

// - Data --------------------------------------------------------------

const confirmOn = ref(false);

const form = reactive({
    name: null as null | string,
    can_inherit_key: true,
    maps_api_key: null as null | string,
});

const errors = ref<Record<string, string>>({
    name: '',
    can_inherit_key: '',
    maps_api_key: '',
});

// - Methods -----------------------------------------------------------

function clearMessage() {
    messageStore.clearFlashMessageList();
}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly</style>