<template>
    <form class="vform mt-16 mb-4" autocomplete="off">
        <TheFlashMessage></TheFlashMessage>
        <!-- Row 1: Vendor & Model -->
        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }"  @click="clearMessage">

            <div class="vform__group mt-7">
                <label class="vform__label" for="vendor">Vendor<span class="vform__required">*</span></label>
                <p class="vform__error">{{ errors.vendor }}</p>
                <VueSelect v-model="form.vendor" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                    class="vform__group" :style="[vueSelectStyles, selectErrorStyle(!!errors.vendor)]"
                    :options="[{ label: 'Teltonika', value: 'teltonika' }]" placeholder="" id="vendor" />
            </div>

            <div class="vform__group mt-7">
                <label class="vform__label" for="model">Model<span class="vform__required">*</span></label>
                <p class="vform__error">{{ errors.model }}</p>
                <VueSelect v-model="form.model" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                    class="vform__group" :style="[vueSelectStyles, selectErrorStyle(!!errors.model)]" :options="[
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
        <div class="vform__row" :class="{ 'vform__disabled': confirmOn || form.asset_id != null }"  @click="clearMessage">

            <div class="vform__group mt-7">
                <label class="vform__label" for="organisation_id">Organisation<span
                        class="vform__required">*</span></label>
                <p class="vform__error" v-if="form.asset_id != null">Organisation can’t be changed when device is
                    attached.</p>
                <p class="vform__error" v-else>{{ errors.organisation_id }}</p>
                <VueSelect v-model="form.organisation_id" :shouldAutofocusOption="false"
                    :isDisabled="confirmOn || form.asset_id != null" class="vform__group"
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.organisation_id)]" :options="getOrganisations"
                    placeholder="" id="organisation_id" />
            </div>

            <div class="vform__group mt-7">
                <label class="vform__label" for="status">Status<span class="vform__required">*</span></label>
                <p class="vform__error">{{ errors.status }}</p>
                <VueSelect v-model="form.status" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                    class="vform__group" :style="[vueSelectStyles, selectErrorStyle(!!errors.status)]" :options="[
                        { label: 'Active', value: 'active' },
                        { label: 'Disabled', value: 'disabled' },
                        { label: 'Retired', value: 'retired' },
                        { label: 'New', value: 'new' }
                    ]" placeholder="" id="status" />
            </div>

        </div>

        <!-- Row 3: Protocol, ICCID, MSISDN -->
        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }"  @click="clearMessage">

            <div class="vform__group mt-7">
                <label class="vform__label" for="protocol">Protocol<span class="vform__required">*</span></label>
                <p class="vform__error">{{ errors.protocol }}</p>
                <VueSelect v-model="form.protocol" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                    class="vform__group" :style="[vueSelectStyles, selectErrorStyle(!!errors.protocol)]"
                    :options="[{ label: '4G', value: '4G' }]" placeholder="" id="protocol" />
            </div>

            <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

                <div class="vform__group mt-7">
                    <label class="vform__label" for="iccid">ICCID</label>
                    <input v-model.trim="form.iccid" :class="{ 'vform__input--error': errors.iccid }"
                        class="vform__input" id="iccid" type="text" placeholder="Enter SIM Card ICCID"
                        :disabled="confirmOn" />
                    <p class="vform__error">{{ errors.iccid }}</p>
                </div>

                <div class="vform__group mt-7">
                    <label class="vform__label" for="msisdn">MSISDN</label>
                    <input v-model.trim="form.msisdn" :class="{ 'vform__input--error': errors.msisdn }"
                        class="vform__input" id="msisdn" type="text" placeholder="Enter SIM Card MSISDN"
                        :disabled="confirmOn" />
                    <p class="vform__error">{{ errors.msisdn }}</p>
                </div>

            </div>
        </div>

        <!-- Row 4: External ID Type & External ID -->
        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }"  @click="clearMessage">
            <div class="vform__group mt-7">
                <label class="vform__label" for="external_id_type">External ID Type <span
                        class="vform__required">*</span></label>
                <p class="vform__error">{{ errors.external_id_type }}</p>
                <VueSelect v-model="form.external_id_type" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                    class="vform__group" :style="[vueSelectStyles, selectErrorStyle(!!errors.external_id_type)]"
                    :options="[{ label: 'Imei', value: 'imei' }]" placeholder="" id="external_id_type" />
            </div>
            <div class="vform__group mt-7">
                <label class="vform__label" for="device_id">External ID <span class="vform__required">*</span></label>
                <input v-model.trim="form.external_id" :class="{ 'vform__input--error': errors.external_id }"
                    class="vform__input" id="device_id" type="text" placeholder="Enter device ID"
                    :disabled="confirmOn" />
                <p class="vform__error">{{ errors.external_id }}</p>
            </div>
        </div>

        <!-- Row 5: Buttons -->
        <div class="vform__row mt-16">
            <button v-if="!confirmOn" class="vbtn vbtn--sky" @click.prevent="initUpdateDevice" type="button">Update
                Device</button>
            <button v-if="confirmOn" class="vbtn vbtn--zinc-lt" @click.prevent="confirmOn = false"
                type="button">Cancel</button>
            <button v-if="confirmOn" class="vbtn vbtn--sky" @click.prevent="updateDevice" type="button">Confirm</button>
        </div>
    </form>
</template>




<!-- --------------------------------------------------------------- -->

<script setup lang="ts">

import VueSelect from "vue3-select-component";
import { computed, onDeactivated, onMounted, reactive, ref, toRaw, watch } from 'vue';
import type { Device } from "@/types/device.type";
import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";
import { useOrganisationStore } from "@/stores/organisationStore";
import { useDeviceStore } from "@/stores/deviceStore";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/authStore";
import { useMessageStore } from "@/stores/messageStore";
import TheFlashMessage from "@/components/commen/TheFlashMessage.vue";


const vueSelectStyles = useVueSelectStyles();

// - Props -------------------------------------------------------------

const props = defineProps<{
    deviceUuid?: string | null,
}>();

// - Store -------------------------------------------------------------

const organisationStore = useOrganisationStore();
const deviceStore = useDeviceStore();
const messageStore = useMessageStore();


const { getDevices, uuidToIdMap } = storeToRefs(deviceStore);

// -Types --------------------------------------------------------------

type Form = typeof form;

// - Data --------------------------------------------------------------
const confirmOn = ref(false);

const device = ref<null | Device>(null);

const form = reactive({
    id: null as null | string,
    external_id: null as null | string,
    external_id_type: null as null | string,
    protocol: '4G' as string,
    status: 'active' as string,
    vendor: 'teltonika' as string,
    model: null as null | string,
    iccid: null as null | string,
    msisdn: null as null | string,
    organisation_id: null as null | string,
    asset_id: null as null | string,
});

const errors = ref<Record<string, string>>({
    vendor: '',
    model: '',
    organisation_id: '',
    status: '',
    protocol: '',
    iccid: '',
    msisdn: '',
    external_id_type: '',
    external_id: '',
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
    messageStore.clearFlashMessageList();
}


function initUpdateDevice() {
    confirmOn.value = true;

    errors.value = {
        vendor: '',
        model: '',
        organisation_id: '',
        status: '',
        protocol: '',
        iccid: '',
        msisdn: '',
        external_id_type: '',
        external_id: '',
    };
}

// normalize helpers
const norm = (v: unknown) => (v === '' || v === undefined ? null : v);
const same = (a: unknown, b: unknown) => String(a ?? '') === String(b ?? '');

function buildUpdatePayload(form: Form, current: Device) {
    const payload: Record<string, any> = {};

    // 1) Top-level fields (excluding id + attributes-related inputs)

    const {
        id: _omitId,
        iccid,
        msisdn,
        ...coreFields
    } = toRaw(form)

    const coreKeys = Object.keys(coreFields) as Array<keyof typeof coreFields>;

    for (let key of coreKeys) {
        // form values might be strings; device values might be numbers/nulls; normalize before compare
        const newVal = norm(coreFields[key] as unknown);

        const curVal = norm((current as any)[key]);

        if (!same(newVal, curVal)) {
            payload[key as string] = coreFields[key];
        }
    }

    // 2) Attributes merge/diff (preserve unknown attrs, update/remove iccid/msisdn)
    const curAttrs = { ...(current.attributes ?? {}) };

    // set or delete iccid
    if (iccid && iccid !== '') {
        curAttrs.iccid = iccid
    }
    else {
        delete curAttrs.iccid;
    }

    // set or delete msisdn
    if (msisdn && msisdn !== '') {
        curAttrs.msisdn = msisdn
    }
    else {
        delete curAttrs.msisdn;
    }

    // only include attributes if they actually changed
    const prevAttrsJson = JSON.stringify(current.attributes ?? {});
    const nextAttrsJson = JSON.stringify(curAttrs);
    if (prevAttrsJson !== nextAttrsJson) {
        payload.attributes = curAttrs;
    }

    return payload;
}

async function updateDevice() {

    if (!device.value) return;

    const payload = buildUpdatePayload(form, device.value);


    if (Object.keys(payload).length === 0) {

        messageStore.setFlashMessagesList(
            ['No changes detected.'],
            'flash-message--orange'
        );
        confirmOn.value = false;
        return;
    }

    try {
        // Send request
        const r = await deviceStore.updatedDevice(device.value.id, payload);     
        deviceStore.addDeviceToStore(r.data.data.device);   

        // Success message
        messageStore.setFlashMessagesList([r.data.message], 'flash-message--blue');

    } catch (err : any) {
        // create
        // Try to extract server-side validation errors
        const fieldErrors = err?.response?.data?.error?.details?.fieldErrors;

  
        if (fieldErrors && typeof fieldErrors === "object") {
            for (const key in fieldErrors) {
                if (Object.prototype.hasOwnProperty.call(errors.value, key)) {
                    errors.value[key] = fieldErrors[key][0];
                }
            }
            messageStore.setFlashMessagesList(
                ["Please fix the highlighted errors and try again."],
                'flash-message--orange'
            );
            return;
        }

        // Known global error messages from backend
        const message = err?.response?.data?.message;
        if (message === 'Invalid input.') {
            messageStore.setFlashMessagesList(
                ["Some of the provided information is invalid."],
                'flash-message--orange'
            );
            return;
        }

        // Fallback for totally unexpected errors
        messageStore.setFlashMessagesList(
            [ message ?? "An unexpected error occurred. Please try again later."],
            'flash-message--orange'
        );

        // Always log error for developer debugging
        console.error("! DeviceUpdateView updateDevice !", err);
    } finally {
        confirmOn.value = false;
    }

}

defineExpose({
    updateDevice
});

watch(
    [() => props.deviceUuid, getDevices, uuidToIdMap],
    ([deviceUuid, devices, uuidToIdMap]) => {

        if (devices && deviceUuid) {

            const _id = uuidToIdMap[deviceUuid];
            const d = devices[_id];
            device.value = d;

            if (d) {
                form.id = d.id || '';
                form.external_id = d.external_id || '';
                form.external_id_type = d.external_id_type || '';
                form.protocol = d.protocol || '';
                form.status = d.status || '';
                form.vendor = d.vendor || '';
                form.model = d.model || '';
                form.iccid = d.attributes?.iccid || '';
                form.msisdn = d.attributes?.msisdn || '';
                form.organisation_id = d.organisation_id;
                form.asset_id = d.asset_id;
            }
        }
    },
    { immediate: true }
);



</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
// </style>