<template>

    <form class="vform mt-16 mb-10" autocomplete="off" @click="clearMessage">
        <div class="vform__row mt-4 " :class="{ 'vform__disabled': confirmOn }">

            <div class="vform__group">
                <label class="vform__label">Vendor<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group vue-custom-select" v-model="vendor" 
                    :options="[
                        { label: 'Teltonika', value: 'teltonika' },                     
                    ]" 
                    placeholder="" />
            </div>

            <div class="vform__group">
                <label class="vform__label">Model<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group vue-custom-select" v-model="model" 
                    :options="[
                        { label: 'FMC130', value: 'FMC130' },                       
                        { label: 'FMC150', value: 'FMC150' },                       
                        { label: 'GH5200', value: 'GH5200' },                       
                        { label: 'FPM100', value: 'FPM100' },                       
                        { label: 'TMT250', value: 'TMT250' },                       
                        { label: 'TAT240', value: 'TAT240' },                       
                        { label: 'FCM130', value: 'FCM130' },                       
                    ]" 
                    placeholder="" />
            </div>
        </div>


        <div class="vform__row mt-4 " :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group">
                <label class="vform__label">Protocol<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group vue-custom-select" v-model="protocol" 
                    :options="[
                        { label: '4G', value: '4G' },                     
                    ]" 
                    placeholder="" />
            </div>

            <div class="vform__group">
                <label class="vform__label">Status<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group vue-custom-select" v-model="status" 
                    :options="[
                        { label: 'Active', value: 'active' },
                        { label: 'Disabled', value: 'disabled' },
                        { label: 'Retired', value: 'retired' },                       
                    ]" 
                    placeholder="" />
            </div>
            
        </div>
        <div class="vform__row mt-6 " :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group ">
                <label class="vform__label" for="device_id">External ID <span class="vform__required">*</span></label>
                <input class="vform__input" id="device_id" type="text" placeholder="Enter device ID"
                    v-model.trim="external_id" :disabled="confirmOn">
            </div>

            <div class="vform__group">
                <label class="vform__label">External ID Type <span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group vue-custom-select" v-model="external_id_type" 
                    :options="[
                        { label: 'Imei', value: 'imei' },
                    ]" 
                    placeholder="" />
            </div>
        </div>

    </form>
</template>

<!-- --------------------------------------------------------------- -->
 
<script setup lang="ts">

import VueSelect from "vue3-select-component";
import { ref } from 'vue';

const confirmOn = ref(false)

const external_id = ref<null | string>(null)
const external_id_type = ref<null | string>(null)
const protocol = ref<null | string>('4G')
const status = ref<null | string>('active')
const vendor = ref<null | string>('teltonika')
const model = ref<null | string>(null)


function clearMessage() {
}


function updateDevice() {
    console.log('update device')
}

defineExpose({
  updateDevice
});

</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
.vue-custom-select {
     --vs-min-height: 4rem;
    --vs-padding: 1.9rem 0.5rem 0.5rem 0.5rem;
    --vs-background-color: var(--color-zinc-100);
    --vs-text-color: var(--color-text-1);
    --vs-border: 1px solid var(--color-zinc-300);
    --vs-border-radius: var(--radius-md, 0.375rem);
    --vs-font-weight: 300;
    --vs-font-size: 1rem;
    --vs-font-family: var(--font-action);
    --vs-outline-width: 0;
    --vs-outline-color: none;
    --vs-outline-color: var(--color-blue-500);
    --vs-menu-z-index: 2000;
}
</style>