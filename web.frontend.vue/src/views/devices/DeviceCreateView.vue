<template>
    <form class="vform mt-16" autocomplete="off" @click="clearMessage">

        <!-- Row 1: External ID & Type -->
        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

            <div class="vform__group mb-7">
                <label class="vform__label" for="device_id">External ID <span class="vform__required">*</span></label>
                <input v-model.trim="form.external_id" 
                    :class="{ 'vform__input--error': errors.external_id }" class="vform__input"
                    id="device_id" type="text"
                    placeholder="Enter device ID" :disabled="confirmOn">
                <p class="vform__error">{{ errors.external_id }}</p>
            </div>

            <div class="vform__group mb-7">
                <label class="vform__label">External ID Type <span class="vform__required">*</span></label>
                <VueSelect v-model="form.external_id_type" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.external_id_type)]" class="vform__group" 
                    :options="[
                        { label: 'Imei', value: 'imei' },
                    ]" placeholder="" />
                <p class="vform__error">{{ errors.external_id_type }}</p>
            </div>

        </div>

        <!-- Row 2: Organisation, Vendor & Model -->
        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

            <div class="vform__group mb-7">
                <label class="vform__label" for="organisation_id">Organisation<span
                        class="vform__required">*</span></label>
                <VueSelect v-model="form.organisation_id" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                    class="vform__group" :style="[vueSelectStyles, selectErrorStyle(!!errors.organisation_id)]"
                    :options="getOrganisations" placeholder="" id="organisation_id" />
                <p class="vform__error">{{ errors.organisation_id }}</p>
            </div>

            <div class="vform__row">

                <div class="vform__group mb-7">
                    <label class="vform__label">Vendor<span class="vform__required">*</span></label>
                    <VueSelect v-model="form.vendor" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                        :style="[vueSelectStyles, selectErrorStyle(!!errors.vendor)]" class="vform__group" 
                        :options="[
                            { label: 'Teltonika', value: 'teltonika' },
                        ]" placeholder="" />
                    <p class="vform__error">{{ errors.vendor }}</p>
                </div>

                <div class="vform__group mb-7">
                    <label class="vform__label">Model<span class="vform__required">*</span></label>
                    <VueSelect v-model="form.model" 
                        :shouldAutofocusOption="false"
                        :isDisabled="confirmOn" 
                        :style="[vueSelectStyles, selectErrorStyle(!!errors.model)]" class="vform__group"
                        :options="[
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
                <VueSelect v-model="form.protocol"
                    :shouldAutofocusOption="false" 
                    :isDisabled="confirmOn" class="vform__group"
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.protocol)]" 
                    :options="[
                        { label: '4G', value: '4G' },
                    ]" placeholder="" />
                <p class="vform__error">{{ errors.protocol }}</p>
            </div>

            <div class="vform__group mb-7">
                <label class="vform__label">Status<span class="vform__required">*</span></label>
                <VueSelect v-model="form.status" class="vform__group"
                    :shouldAutofocusOption="false" 
                    :isDisabled="confirmOn" 
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.status)]"  :options="[
                        { label: 'New', value: 'new' },
                        { label: 'Active', value: 'active' },
                        { label: 'Disabled', value: 'disabled' },
                        { label: 'Retired', value: 'retired' },
                    ]" placeholder="" />
                <p class="vform__error">{{ errors.status }}</p>
            </div>

            <div class="vform__group mb-7">
                <label class="vform__label" for="iccid">ICCID</label>
                <input v-model.trim="form.iccid" class="vform__input" id="iccid" type="text"
                    placeholder="Enter SIM Card ICCID" 
                    :disabled="confirmOn"
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.iccid)]">
                <p class="vform__error">{{ errors.iccid }}</p>
            </div>

            <div class="vform__group mb-7">
                <label class="vform__label" for="msisdn">MSISDN</label>
                <input v-model.trim="form.msisdn" 
                    class="vform__input" id="msisdn" type="text"
                    placeholder="Enter SIM Card MSISDN" :disabled="confirmOn"
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.msisdn)]">
                <p class="vform__error">{{ errors.msisdn }}</p>
            </div>

        </div>

        <div class="vform__row mt-9 ">
            <button v-if="!confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="initCreateDevice">Register Device</button>
            <button v-if="confirmOn" class="vbtn vbtn--zinc-lt mt-3" @click.prevent="confirmOn = false">Cancel</button>
            <button v-if="confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="createDevice">Confirm</button>
        </div>
    </form>
</template>


<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import { onActivated, onBeforeMount, onMounted, reactive, ref } from 'vue';
import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";
import { computed } from "vue";
import { useOrganisationStore } from "@/stores/organisationStore";
import { useDeviceStore } from "@/stores/deviceStore";
import { useMessageStore } from "@/stores/messageStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useDashboardStore } from "@/stores/dashboardStore";


// - Composable --------------------------------------------------------

const vueSelectStyles = useVueSelectStyles();

// - Store -------------------------------------------------------------

const messageStore = useMessageStore();
const organisationStore = useOrganisationStore();
const deviceStore = useDeviceStore();
const settingsStore = useSettingsStore();

const dashboardStore = useDashboardStore();

// - Data --------------------------------------------------------------
const confirmOn = ref(false)

const form = reactive({
  external_id: null as null | string,
  external_id_type: null as null | string,
  protocol: '4G' as string,
  status: 'active' as string,
  vendor: 'teltonika' as string,
  model: null as null | string,
  iccid: null as null | string,
  msisdn: null as null | string,
  organisation_id: null as null | string,
});

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
    messageStore.clearFlashMessageList();
}

function initCreateDevice() {
    errors.value = {
        external_id: '',
        external_id_type: '',
        organisation_id: '',
        vendor: '',
        model: '',
        protocol: '',
        status: '',
        iccid: '',
        msisdn: '',
    };
    clearMessage();
    confirmOn.value = true
}

async function createDevice() {

    dashboardStore.setIsLoading(true);

    try {
        // Create payload, omitting iccid/msisdn from top-level if you only want them in attributes
        // (If backend expects iccid/msisdn both top-level & in attributes, spread as needed)
        const {
            iccid,
            msisdn,
            ...coreFields
        } = form;

        // Build 'attributes' only if fields are present
        const attributes: Record<string, any> = {};
        if (iccid) attributes.iccid = iccid;
        if (msisdn) attributes.msisdn = msisdn;

        const payload = {
            ...coreFields,
            attributes,
        };

        // Send request
        const r = await deviceStore.createDevice(payload);
        deviceStore.addDeviceToStore(r.data.data.device);

        // Success message
        messageStore.setFlashMessagesList([r.data.message], 'flash-message--blue');

        // Reset form fields to defaults     
        Object.assign(form, {
            external_id: null,
            external_id_type: form.external_id_type,
            protocol: form.protocol,
            status: 'active',
            vendor: form.vendor,
            model: form.model,
            iccid: null,
            msisdn: null,
            organisation_id: form.organisation_id,
        });

    } catch (err: any) {
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
            ["An unexpected error occurred. Please try again later."],
            'flash-message--orange'
        );

        // Always log error for developer debugging
        console.error("! DeviceCreateView createDevice !", err);

    } finally {
        // Always reset confirm flag, success or error
        confirmOn.value = false;
        dashboardStore.setIsLoading(false);
    }
}



onActivated(() => {
    const orgID = settingsStore.getAuthenticatedUser?.organisation.id
    form.organisation_id = orgID ?? null;
    form.external_id_type = 'imei';
});


</script>

<!-- --------------------------------------------------------------- -->

<style scoped lang="scss">
// 
</style>