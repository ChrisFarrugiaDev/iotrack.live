<template>
    <form class="vform mt-16 mb-4" autocomplete="off" @click="clearMessage">
        <!-- Row 1: Vendor & Model -->
        <div class="vform__row mt-4" :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group">
                <label class="vform__label" for="vendor">Vendor<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="vendor"
                    :options="[{ label: 'Teltonika', value: 'teltonika' }]" placeholder="" id="vendor" />
            </div>
            <div class="vform__group">
                <label class="vform__label" for="model">Model<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="model"
                    :options="[
                        { label: 'FMC130', value: 'FMC130' },
                        { label: 'FMC150', value: 'FMC150' },
                        { label: 'GH5200', value: 'GH5200' },
                        { label: 'FPM100', value: 'FPM100' },
                        { label: 'TMT250', value: 'TMT250' },
                        { label: 'TAT240', value: 'TAT240' },
                        { label: 'FCM130', value: 'FCM130' }
                    ]" placeholder="" id="model" />
            </div>
        </div>

        <!-- Row 2: Organisation & Status -->
        <div class="vform__row mt-4" :class="{ 'vform__disabled': confirmOn || asset_id != null }">
            <div class="vform__group">
                <label class="vform__label" for="organisation_id">Organisation<span
                        class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn || asset_id != null" class="vform__group" :style="vueSelectStyles"
                    v-model="organisation_id" :options="getOrganisations" placeholder="" id="organisation_id" />
            </div>
            <div class="vform__group">
                <label class="vform__label" for="status">Status<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="status"
                    :options="[
                        { label: 'Active', value: 'active' },
                        { label: 'Disabled', value: 'disabled' },
                        { label: 'Retired', value: 'retired' },
                        { label: 'New', value: 'new' }
                    ]" placeholder="" id="status" />
            </div>
        </div>

        <!-- Row 3: Protocol, ICCID, MSISDN (as you had them: ICCID & MSISDN in a nested row) -->
        <div class="vform__row mt-6" :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group">
                <label class="vform__label" for="protocol">Protocol<span class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="protocol"
                    :options="[{ label: '4G', value: '4G' }]" placeholder="" id="protocol" />
            </div>
            <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
                <div class="vform__group">
                    <label class="vform__label" for="iccid">ICCID</label>
                    <input class="vform__input" id="iccid" type="text" placeholder="Enter SIM Card ICCID"
                        v-model.trim="iccid" :disabled="confirmOn" />
                </div>
                <div class="vform__group">
                    <label class="vform__label" for="msisdn">MSISDN</label>
                    <input class="vform__input" id="msisdn" type="text" placeholder="Enter SIM Card MSISDN"
                        v-model.trim="msisdn" :disabled="confirmOn" />
                </div>
            </div>
        </div>

        <!-- Row 4: External ID Type & External ID -->
        <div class="vform__row mt-4" :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group">
                <label class="vform__label" for="external_id_type">External ID Type <span
                        class="vform__required">*</span></label>
                <VueSelect :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles"
                    v-model="external_id_type" :options="[{ label: 'Imei', value: 'imei' }]" placeholder=""
                    id="external_id_type" />
            </div>
            <div class="vform__group">
                <label class="vform__label" for="device_id">External ID <span class="vform__required">*</span></label>
                <input class="vform__input" id="device_id" type="text" placeholder="Enter device ID"
                    v-model.trim="external_id" :disabled="confirmOn" />
            </div>
        </div>

        <!-- Row 5: Buttons -->
        <div class="vform__row mt-16">
            <button v-if="!confirmOn" class="vbtn vbtn--sky" @click.prevent="confirmOn = true" type="button">Update
                Device</button>
            <button v-if="confirmOn" class="vbtn vbtn--zinc-lt" @click.prevent="confirmOn = false"
                type="button">Cancel</button>
            <button v-if="confirmOn" class="vbtn vbtn--sky" @click.prevent="confirmOn = false"
                type="button">Confirm</button>
        </div>
    </form>
</template>



<!-- --------------------------------------------------------------- -->

<script setup lang="ts">

import VueSelect from "vue3-select-component";
import { computed, onMounted, ref, watch } from 'vue';
import type { Device } from "@/types/device.type";
import { useVueSelectStyles } from '@/composables/useVueSelectStyles';
import { useOrganisationStore } from "@/stores/organisationStore";
import { useAssetStore } from "@/stores/assetStore";

const vueSelectStyles = useVueSelectStyles();

// - Props -------------------------------------------------------------

const props = defineProps<{
    devices?: Record<string, Device> | null,
    selectedDeviceUUID?: string | null,
    organisations?: Record<string, any> | null
}>();

// - Store -------------------------------------------------------------

const organisationStore = useOrganisationStore();
const assetStore = useAssetStore();

// - Data --------------------------------------------------------------
const confirmOn = ref(false);

const id = ref<null | string>(null);
const external_id = ref<null | string>(null);
const external_id_type = ref<null | string>(null);
const protocol = ref<null | string>('4G');
const status = ref<null | string>('active');
const vendor = ref<null | string>('teltonika');
const model = ref<null | string>(null);
const iccid = ref<null | string>(null);
const msisdn = ref<null | string>(null);
const organisation_id = ref<null | string>(null);
const asset_id = ref<null | string>(null);



// - Computed ----------------------------------------------------------
const getOrganisations = computed(() => {
    const orgs = organisationStore.getOrganisationScope || {};

    return Object.values(orgs).map((o: any) => ({
        label: o.name,
        value: o.id,
    }));
});

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
                id.value = d.id || '';
                external_id.value = d.external_id || '';
                external_id_type.value = d.external_id_type || '';
                protocol.value = d.protocol || '';
                status.value = d.status || '';
                vendor.value = d.vendor || '';
                model.value = d.model || '';
                iccid.value = d.attributes?.iccid || '';
                msisdn.value = d.attributes?.msisdn || '';
                organisation_id.value = d.organisation_id;
                asset_id.value = d.asset_id;
            }
        }
    },
    { immediate: true }
);

</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
// </style>