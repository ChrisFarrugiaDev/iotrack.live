<template>

    <form class="vform mt-16 mb-4" autocomplete="off" @click="clearMessage">
        <div class="vform__row mt-4 " :class="{ 'vform__disabled': confirmOn }">

            <div class="vform__group">
                <label class="vform__label">Vendor<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="vendor" :options="[
                    { label: 'Teltonika', value: 'teltonika' },
                ]" placeholder="" />
            </div>

            <div class="vform__group">
                <label class="vform__label">Model<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="model" :options="[
                    { label: 'FMC130', value: 'FMC130' },
                    { label: 'FMC150', value: 'FMC150' },
                    { label: 'GH5200', value: 'GH5200' },
                    { label: 'FPM100', value: 'FPM100' },
                    { label: 'TMT250', value: 'TMT250' },
                    { label: 'TAT240', value: 'TAT240' },
                    { label: 'FCM130', value: 'FCM130' },
                ]" placeholder="" />
            </div>
        </div>


        <div class="vform__row mt-4 " :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group">
                <label class="vform__label">Protocol<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="protocol" :options="[
                    { label: '4G', value: '4G' },
                ]" placeholder="" />
            </div>

            <div class="vform__group">
                <label class="vform__label">Status<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="status" :options="[
                    { label: 'Active', value: 'active' },
                    { label: 'Disabled', value: 'disabled' },
                    { label: 'Retired', value: 'retired' },
                    { label: 'New', value: 'new' },
                ]" placeholder="" />
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
                <VueSelect :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="external_id_type"
                    :options="[
                        { label: 'Imei', value: 'imei' },
                    ]" placeholder="" />
            </div>
        </div>

        <div class="vform__row mt-4 " :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group ">
                <label class="vform__label" for="iccid">ICCID</label>
                <input class="vform__input" id="iccid" type="text" placeholder="Enter SIM Card ICCID"
                    v-model.trim="iccid" :disabled="confirmOn">
            </div>
            <div class="vform__group ">
                <label class="vform__label" for="msisdn">MSISDN</label>
                <input class="vform__input" id="msisdn" type="text" placeholder="Enter SIM Card MSISDN"
                    v-model.trim="msisdn" :disabled="confirmOn">
            </div>
        </div>


        <div class="vform__row mt-16 ">
            <button v-if="!confirmOn" class="vbtn vbtn--sky" @click.prevent="confirmOn = true">Update Device</button>
            <button v-if="confirmOn" class="vbtn vbtn--zinc-lt" @click.prevent="confirmOn = false">Cancel</button>
            <button v-if="confirmOn" class="vbtn vbtn--sky" @click.prevent="confirmOn = false">Confirm</button>
        </div>

    </form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">

import VueSelect from "vue3-select-component";
import { computed, onMounted, ref, watch } from 'vue';
import type { Device } from "@/types/device.type";
import { useVueSelectStyles } from '@/composables/useVueSelectStyles';

const vueSelectStyles = useVueSelectStyles();

// - Props -------------------------------------------------------------

const props = defineProps<{
    devices?: Record<string, Device> | null,
    selectedDeviceUUID?: string | null,
    organisations?: Record<string, any> | null
}>();


// - Data --------------------------------------------------------------
const confirmOn = ref(false);

const external_id = ref<null | string>(null);
const external_id_type = ref<null | string>(null);
const protocol = ref<null | string>('4G');
const status = ref<null | string>('active');
const vendor = ref<null | string>('teltonika');
const model = ref<null | string>(null);
const iccid = ref<null | string>(null);
const msisdn = ref<null | string>(null);



function clearMessage() {
}


function updateDevice() {
    console.log('update device')
}

defineExpose({
    updateDevice
});

watch(
    [() => props.devices, () => props.selectedDeviceUUID],
    ([devices, selectedDeviceUUID]) => {
        if (devices && selectedDeviceUUID) {
            const list = Object.values(devices);
            const d = list.find((dev: any) => dev.uuid === selectedDeviceUUID);

            if (d) {
                external_id.value = d.external_id || '';
                external_id_type.value = d.external_id_type || '';
                protocol.value = d.protocol || '';
                status.value = d.status || '';
                vendor.value = d.vendor || '';
                model.value = d.model || '';
                iccid.value = d.attributes?.iccid || '';
                msisdn.value = d.attributes?.msisdn || '';
            }
        }
    },
    { immediate: true }
);

</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
// 
</style>