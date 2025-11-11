<template>
	<form class="vform mt-16" autocomplete="off" @click="clearMessage">

		<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

			<div class="vform__group mt-7">
				<label class="vform__label" for="device_id">Asset Name<span class="vform__required">*</span></label>
				<input v-model.trim="form.name" :class="{ 'vform__input--error': errors.name }" class="vform__input"
					id="device_id" type="text" placeholder="Enter asset name" :disabled="confirmOn">
				<p class="vform__error">{{ errors.name }}</p>
			</div>

			<div class="vform__group mt-7">
				<label class="vform__label">Asset Type<span class="vform__required">*</span></label>
				<VueSelect v-model="form.asset_type" :shouldAutofocusOption="false" :isDisabled="confirmOn"
					:style="[vueSelectStyles, selectErrorStyle(!!errors.asset_type)]" class="vform__group" :options="[
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
				<VueSelect v-model="form.organisation_id" :shouldAutofocusOption="false" :isDisabled="confirmOn"
					:style="[vueSelectStyles, selectErrorStyle(!!errors.organisation_id)]" class="vform__group"
					:options="getOrganisations" placeholder="" />
				<p class="vform__error">{{ errors.organisation_id }}</p>
			</div>

			<div class="vform__group mt-7">
				<label class="vform__label">Device</label>
				<VueSelect v-model="form.device_id" :shouldAutofocusOption="false" :isDisabled="confirmOn"
					:style="[vueSelectStyles, selectErrorStyle(!!errors.device_id)]" class="vform__group"
					:options="getDevices" placeholder="" />
				<p class="vform__error">{{ errors.device_id }}</p>
			</div>

		</div>

		<div v-if="form.asset_type == 'vehicle'">
			<div class="vheading--4 mt-12 mb-2">Vehicle</div>

			<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
				<div class="vform__group mt-7">
					<label class="vform__label" for="registration_number">Registration No.</label>
					<input v-model.trim="form.vehicle.registration_number" class="vform__input" id="registration_number"
						type="text" placeholder="e.g. ABC-123" :disabled="confirmOn">
				</div>

				<div class="vform__group mt-7">
					<label class="vform__label">Make</label>
					<input v-model="form.vehicle.make" type="text" class="vform__input" :disabled="confirmOn"
						placeholder="Enter make" />
				</div>
			</div>

			<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
				<div class="vform__group mt-7">
					<label class="vform__label">Model</label>
					<input v-model="form.vehicle.model" type="text" class="vform__input" :disabled="confirmOn"
						placeholder="Enter model" />
				</div>

				<div class="vform__group mt-7">
					<label class="vform__label">Year</label>
					<input v-model="form.vehicle.year" type="number" class="vform__input" :disabled="confirmOn"
						placeholder="Enter year" />
				</div>
			</div>

			<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
				<div class="vform__group mt-7">
					<label class="vform__label">Color</label>
					<input v-model="form.vehicle.color" type="text" class="vform__input" :disabled="confirmOn"
						placeholder="Enter color" />
				</div>

				<div class="vform__group mt-7">
					<label class="vform__label">Fuel Type</label>
					<input v-model="form.vehicle.fuel_type" type="text" class="vform__input" :disabled="confirmOn"
						placeholder="Enter fuel type" />
				</div>
			</div>

		</div>

		<div v-if="form.asset_type == 'personal'">
			<div class="vheading--4 mt-12 mb-2">Personal</div>

			<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
				<div class="vform__group mt-7">
					<label class="vform__label">Full Name</label>
					<input v-model="form.personal.full_name" class="vform__input" type="text"
						placeholder="Enter full name" :disabled="confirmOn" />
				</div>

				<div class="vform__group mt-7">
					<label class="vform__label">Phone Number</label>
					<input v-model="form.personal.phone_number" class="vform__input" type="text"
						placeholder="e.g. +356 9999 9999" :disabled="confirmOn" />
				</div>
			</div>


			<div class="vform__group--textarea mt-7 w-full">
				<label class="vform__label">Info</label>
				<textarea v-model="form.personal.info" class="vform__input vform__input--textarea"
					placeholder="Additional information" rows="3" :disabled="confirmOn"></textarea>
			</div>

		</div>

		<div v-if="form.asset_type == 'asset'">
			<div class="vheading--4 mt-12 mb-2">Equipment / Asset</div>

			<div class="vform__group--textarea mt-7 w-full">
				<label class="vform__label">Info</label>
				<textarea v-model="form.asset.info" class="vform__input vform__input--textarea"
					placeholder="Additional information" rows="3" :disabled="confirmOn"></textarea>
			</div>
		</div>

		<div class="vheading--4 mt-12 mb-10">Photos</div>

		<ImagesUploader class="mt-6" @files-change="onFilesChange" :reset="reset"></ImagesUploader>

		<div class="vform__row mt-9 ">
			<button v-if="!confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="initCreateAsset">Register
				Asset</button>
			<button v-if="confirmOn" class="vbtn vbtn--zinc-lt mt-3" @click.prevent="confirmOn = false">Cancel</button>
			<button v-if="confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="createAsset">Confirm</button>
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
import ImagesUploader, { type UploaderItem } from "@/components/images/ImagesUploader.vue";
import axios from "@/axios";
import { useAppStore } from "@/stores/appStore";
import type { Asset } from "@/types/asset.type";
import { useDashboardStore } from "@/stores/dashboardStore";

const vueSelectStyles = useVueSelectStyles();

// - Store -------------------------------------------------------------

const organisationStore = useOrganisationStore();
const deviceStore = useDeviceStore();
const assetStore = useAssetStore();
const messageStore = useMessageStore();
const appStore = useAppStore();
const dashboardStore = useDashboardStore();

// - Data --------------------------------------------------------------
const confirmOn = ref(false);

const form = reactive({
	name: null as null | string,
	asset_type: 'vehicle' as string,      // default
	organisation_id: null as null | string,
	device_id: null as null | string,     // optional: attach a device
	vehicle: {
		registration_number: null as string | null,
		make: null as string | null,
		model: null as string | null,
		year: null as number | null,
		color: null as string | null,
		fuel_type: null as string | null,
	},
	personal: {
		full_name: null as string | null,
		phone_number: null as string | null,
		info: null as string | null,
	},
	asset: {
		info: null as string | null,
	}
});

const images = ref<UploaderItem[]>([]);

const errors = ref<Record<string, string>>({
	name: '',
	asset_type: '',
	organisation_id: '',
	device_id: '',
});

const reset = ref<number>(0);

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
watch(() => organisationStore.getOrganisation, (val) => {
	if (val?.id) {
		form.organisation_id = val.id
	}
}, {
	immediate: true
});

// - Methods -----------------------------------------------------------

function clearMessage() {
	messageStore.clearFlashMessageList();
}

function onFilesChange(items: UploaderItem[]) {
	images.value = items;
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

	if (form.device_id == null || form.device_id.trim() == "") {
		setTimeout(() => {
			messageStore.setFlashMessagesList(["⚠️ You are about to create this asset without an attached device."], 'flash-message--yellow')
		}, 100)
	}
}

async function createAsset() {

	dashboardStore.setIsLoading(true);

	try {
		const {
			device_id,
			vehicle,
			personal,
			asset,
			...coreFields
		} = form;

		// Build 'attributes' only if fields are present 
		const attributes: Record<string, any> = {};

		switch (form.asset_type) {
			case 'vehicle':
				attributes.vehicle = vehicle
				break;
			case 'personal':
				attributes.personal = personal
				break;
			case 'asset':
				attributes.asset = asset
				break;
		}

		const payload: Record<string, any> = {
			...coreFields,
			attributes,
		};

		if (device_id) { payload.device_id = device_id }

		// Send request
		const r = await assetStore.createAsset(payload);
		assetStore.addAssetToStore(r.data.data.asset);

		const newAsset = r.data.data.asset;

		await uploadImages(newAsset);

		// create images

		// Success message
		messageStore.setFlashMessagesList([r.data.message], 'flash-message--blue');

		form.name = "";
		form.device_id = "";

		Object.assign(form.vehicle, {
			registration_number: null,
			make: null,
			model: null,
			year: null,
			color: null,
			fuel_type: null,
		});
		Object.assign(form.personal, {
			full_name: null,
			phone_number: null,
			info: null,
		});
		Object.assign(form.asset, {
			info: null,
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
		console.error("! AssetCreateView createAsset !", err);

	} finally {
		confirmOn.value = false;
		dashboardStore.setIsLoading(false);
	}
}

async function uploadImages(newAsset: Asset) {

	dashboardStore.setIsLoading(true);

	if (images.value.length == 0) {
		dashboardStore.setIsLoading(false);
		return
	};

	const formData = new FormData();
	formData.append("entity_type", "asset");
	formData.append("entity_id", newAsset.id);

	// Attach each file
	for (const item of images.value) {
		formData.append("images", item.file, item.file.name)
	}

	try {
		const url = `${appStore.getAppUrl}/img/upload`;
		const response = await axios.post(url, formData);

		if (!response.data.data.uploaded || !response.data.data.uploaded.length) return;

		const primary_image = response.data.data.uploaded[0];
		const attributes = {
			...newAsset.attributes,
			primary_image
		}

		const payload = { attributes }

		await assetStore.updatedAsset(newAsset.id, payload);

		newAsset.attributes = {
			...newAsset.attributes,
			primary_image
		}

		assetStore.addAssetToStore(newAsset)


		images.value = [];
		reset.value += 1;

	} catch (err) {
		console.error("! AssetCreateView uploadImages !\n", err);
	} finally {
		dashboardStore.setIsLoading(false);
	}
}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>