<template>
	<form class="vform mt-16" autocomplete="off" @click="clearMessage">

		<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

			<div class="vform__group mt-7">
				<label class="vform__label" for="device_id">Asset Name<span class="vform__required">*</span></label>
				<input v-model.trim="form.name" 
					:class="{ 'vform__input--error': errors.name }" class="vform__input" 
					id="device_id" type="text" placeholder="Enter asset name"
					:disabled="confirmOn">
				<p class="vform__error">{{ errors.name }}</p>
			</div>

			<div class="vform__group mt-7">
				<label class="vform__label">Asset Type<span class="vform__required">*</span></label>
				<VueSelect v-model="form.asset_type" 
					:shouldAutofocusOption="false" 
					:isDisabled="confirmOn" 
					:style="[vueSelectStyles, selectErrorStyle(!!errors.asset_type)]" class="vform__group" 
					:options="[
						{ label: 'Vehicle', value: 'vehicle' },
						{ label: 'Equipment / Asset', value: 'asset' },
						{ label: 'Personal', value: 'personal' },                    
					]" placeholder="" />
				<p class="vform__error">{{ errors.asset_type }}</p>
			</div>

		</div>

		<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

			<div class="vform__group mt-7">
				<label class="vform__label">Organisation<span class="vform__required">*</span></label>
				<VueSelect v-model="form.organisation_id" 
					:shouldAutofocusOption="false" 
					:isDisabled="confirmOn" 
					:style="[vueSelectStyles, selectErrorStyle(!!errors.organisation_id)]" class="vform__group" 
					:options="getOrganisations" 
					placeholder="" />
				<p class="vform__error">{{ errors.organisation_id }}</p>
			</div>

			<div class="vform__group mt-7">
				<label class="vform__label">Device<span class="vform__required">*</span></label>
				<VueSelect v-model="form.device_id" 
					:shouldAutofocusOption="false" 
					:isDisabled="confirmOn" 
					:style="[vueSelectStyles, selectErrorStyle(!!errors.device_id)]" class="vform__group" 
					:options="getDevices" 
					placeholder="" />
				<p class="vform__error">{{ errors.device_id }}</p>
			</div>

		</div>

		<div class="vform__row mt-12 ">
            <button v-if="!confirmOn" class="vbtn vbtn--sky" @click.prevent="initCreateAsset">Register Asset</button>
            <button v-if="confirmOn" class="vbtn vbtn--zinc-lt" @click.prevent="confirmOn = false">Cancel</button>
            <button v-if="confirmOn" class="vbtn vbtn--sky" @click.prevent="createAsset">Confirm</button>           
        </div>

	</form>
</template>


<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import { computed, reactive, ref, watch } from 'vue';
import { useOrganisationStore } from "@/stores/organisationStore";
import { useDeviceStore } from "@/stores/deviceStore";
import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";
import { useMessageStore } from "@/stores/messageStore";
import { useAssetStore } from "@/stores/assetStore";


const vueSelectStyles = useVueSelectStyles();

// - Store -------------------------------------------------------------

const organisationStore = useOrganisationStore();
const deviceStore = useDeviceStore();
const assetStore  = useAssetStore();
const messageStore = useMessageStore();


// - Data --------------------------------------------------------------
const confirmOn = ref(false);

const form = reactive({
  name: null as null | string,
  asset_type: 'vehicle' as string,      // default
  organisation_id: null as null | string,
  device_id: null as null | string,     // optional: attach a device
});

const errors = ref<Record<string, string>>({
	name: '',
	asset_type: '',
	organisation_id: '',
	device_id: '',
});


// - Computed ----------------------------------------------------------
const getOrganisations = computed(() => {
    const orgs = organisationStore.getOrganisationScope || {};

    return Object.values(orgs).map((o: any) => ({
        label: o.name,
        value: o.id,
    }));
});

const getDevices = computed(() => {
  const devices = deviceStore.getDevices ?? {};
  const orgId = form.organisation_id;

  const availableDevices = Object.values(devices)
    .filter((d: any) => d.organisation_id == orgId && d.asset_id == null)
    .map((d: any) => ({
      label: d.model ? `${d.model} ${d.external_id}` : `${d.vendor} ${d.external_id}`,
      value: d.id,
    }));

  // If no devices found, show a disabled message option
  if (availableDevices.length === 0) {
    return [
      {
        label: "No available devices. Select another organisation or update a device.",
        value: null,
        disabled: true,
      },
    ];
  }

  return availableDevices;
});

// - Watch -------------------------------------------------------------
watch(()=>organisationStore.getOrganisation, (val)=>{
	if(val?.id) {
		form.organisation_id = val.id
	}
},{
	immediate: true
});

// - Methods -----------------------------------------------------------

function clearMessage() {
	messageStore.clearFlashMessageList();
}

function initCreateAsset() {
	errors.value = {
		name: '',
		asset_type: '',
		organisation_id: '',
		device_id: '',
	};
	clearMessage();
	confirmOn.value = true;
}


async function createAsset() {

	try {
		const {
			device_id,
			...coreFields
		} = form;

		// Build 'attributes' only if fields are present 
		const attributes: Record<string, any> = {};

		const payload: Record<string, any> = {
			...coreFields,
			attributes,
		};

		if (device_id) { payload.devoce_id = device_id }

		// Send request
        const r = await assetStore.createAsset(payload);
        assetStore.addAssetToStore(r.data.data.asset);

        // Success message
        messageStore.setFlashMessagesList([r.data.message], 'flash-message--blue');


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
        console.error("! AssetCreateView createAsset !", err);

	} finally {
		confirmOn.value = false;
	}

}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly

</style>