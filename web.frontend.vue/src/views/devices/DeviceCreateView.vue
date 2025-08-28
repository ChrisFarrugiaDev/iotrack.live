<template>
    <form class="vform mt-16" autocomplete="off" @click="clearMessage">
        <!-- Row 1: External ID & Type -->
        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group mb-7">
                <label class="vform__label" for="device_id">External ID <span class="vform__required">*</span></label>
                <input class="vform__input" id="device_id" type="text" placeholder="Enter device ID"
                    v-model.trim="external_id" :disabled="confirmOn">
                <p class="vform__error">{{ errors.external_id }}</p>
            </div>
            <div class="vform__group mb-7">
                <label class="vform__label">External ID Type <span class="vform__required">*</span></label>
                <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="external_id_type"
                    :options="[
                        { label: 'Imei', value: 'imei' },
                    ]" placeholder="" />
                <p class="vform__error">{{ errors.external_id_type }}</p>
            </div>
        </div>

        <!-- Row 2: Organisation, Vendor & Model -->
        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group mb-7">
                <label class="vform__label" for="organisation_id">Organisation<span class="vform__required">*</span></label>         
                <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles"
                    v-model="organisation_id" :options="getOrganisations" placeholder="" id="organisation_id" />
                <p class="vform__error">{{ errors.organisation_id }}</p>
            </div>
            <div class="vform__row">
                <div class="vform__group mb-7">
                    <label class="vform__label">Vendor<span class="vform__required">*</span></label>
                    <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="vendor" :options="[
                            { label: 'Teltonika', value: 'teltonika' },                     
                        ]" placeholder="" />
                    <p class="vform__error">{{ errors.vendor }}</p>
                </div>
                <div class="vform__group mb-7">
                    <label class="vform__label">Model<span class="vform__required">*</span></label>
                    <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="model" :options="[
                            { label: 'FMC130', value: 'FMC130' },                       
                            { label: 'FMC150', value: 'FMC150' },                       
                            { label: 'GH5200', value: 'GH5200' },                       
                            { label: 'FPM100', value: 'FPM100' },                       
                            { label: 'TMT250', value: 'TMT250' },                       
                            { label: 'TAT240', value: 'TAT240' },                       
                            { label: 'FCM130', value: 'FCM130' },                       
                        ]" placeholder="" />
                    <p class="vform__error">{{ errors.model }}</p>
                </div>
            </div>
        </div>

        <!-- Row 3: Protocol, Status, ICCID, MSISDN -->
        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
            <div class="vform__group mb-7">
                <label class="vform__label">Protocol<span class="vform__required">*</span></label>
                <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="protocol" :options="[
                        { label: '4G', value: '4G' },                     
                    ]" placeholder="" />
                <p class="vform__error">{{ errors.protocol }}</p>
            </div>
            <div class="vform__group mb-7">
                <label class="vform__label">Status<span class="vform__required">*</span></label>
                <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="status" :options="[
                        { label: 'New', value: 'new' },
                        { label: 'Active', value: 'active' },
                        { label: 'Disabled', value: 'disabled' },
                        { label: 'Retired', value: 'retired' },                       
                    ]" placeholder="" />
                <p class="vform__error">{{ errors.status }}</p>
            </div>
            <div class="vform__group mb-7">
                <label class="vform__label" for="iccid">ICCID</label>
                <input class="vform__input" id="iccid" type="text" placeholder="Enter SIM Card ICCID"
                    v-model.trim="iccid" :disabled="confirmOn">
                <p class="vform__error">{{ errors.iccid }}</p>
            </div>
            <div class="vform__group mb-7">
                <label class="vform__label" for="msisdn">MSISDN</label>
                <input class="vform__input" id="msisdn" type="text" placeholder="Enter SIM Card MSISDN"
                    v-model.trim="msisdn" :disabled="confirmOn">
                <p class="vform__error">{{ errors.msisdn }}</p>
            </div>
        </div>

        <div class="vform__row mt-12 ">
            <button v-if="!confirmOn" class="vbtn vbtn--sky" @click.prevent="confirmOn = true">Register Device</button>
            <button v-if="confirmOn" class="vbtn vbtn--zinc-lt" @click.prevent="confirmOn = false">Cancel</button>
            <button v-if="confirmOn" class="vbtn vbtn--sky" @click.prevent="confirmOn = false">Confirm</button>           
        </div>
    </form>
</template>


<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import { ref } from 'vue';
import { useVueSelectStyles } from "@/composables/useVueSelectStyles";
import { computed } from "vue";
import { useOrganisationStore } from "@/stores/organisationStore";

// - Composable --------------------------------------------------------

const vueSelectStyles = useVueSelectStyles();

// - Store -------------------------------------------------------------

const organisationStore = useOrganisationStore();

const confirmOn = ref(false)

const external_id = ref<null | string>(null);
const external_id_type = ref<null | string>(null);
const protocol = ref<null | string>('4G');
const status = ref<null | string>('active');
const vendor = ref<null | string>('teltonika');
const model = ref<null | string>(null);
const iccid = ref<null | string>(null);
const msisdn = ref<null | string>(null);
const organisation_id = ref<null | string>(null);

const errors = ref<Record<string, string>>({
  external_id: '',
  external_id_type: '',
  organisation_id: '',
  vendor: '',
  model: '',
  protocol: '',
  status: '',
  iccid: '',
  msisdn: '',
});

// - Computed ----------------------------------------------------------

const getOrganisations = computed(() => {
    const orgs = organisationStore.getOrganisationScope || {};

    return Object.values(orgs).map((o: any) => ({
        label: o.name,
        value: o.id,
    }));
});

// - Methods -----------------------------------------------------------

function clearMessage() {
}

</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">

// 

</style>