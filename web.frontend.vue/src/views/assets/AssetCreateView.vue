<template>
	<form class="vform mt-16" autocomplete="off" @click="clearMessage">

		<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
			<div class="vform__group mt-7">
				<label class="vform__label" for="device_id">Asset Name<span class="vform__required">*</span></label>
				<input class="vform__input" id="device_id" type="text" placeholder="Enter asset name"
					v-model.trim="name" :disabled="confirmOn">
				<p class="vform__error">{{ errors.name }}</p>
			</div>
			<div class="vform__group mt-7">
				<label class="vform__label">Asset Type<span class="vform__required">*</span></label>
				<VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="asset_type" :options="[
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
				<VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="organisation_id" :options="getOrganisations" placeholder="" />
				<p class="vform__error">{{ errors.organisation_id }}</p>
			</div>
			<div class="vform__group mt-7">
				<label class="vform__label">Device<span class="vform__required">*</span></label>
				<VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles" v-model="device_id" :options="getDevices" placeholder="" />
				<p class="vform__error">{{ errors.device_id }}</p>
			</div>
		</div>

		<div class="vform__row mt-12 ">
            <button v-if="!confirmOn" class="vbtn vbtn--sky" @click.prevent="confirmOn = true">Register Asset</button>
            <button v-if="confirmOn" class="vbtn vbtn--zinc-lt" @click.prevent="confirmOn = false">Cancel</button>
            <button v-if="confirmOn" class="vbtn vbtn--sky" @click.prevent="confirmOn = false">Confirm</button>           
        </div>

	</form>
</template>


<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import { computed, ref, watch } from 'vue';
import { useOrganisationStore } from "@/stores/organisationStore";
import { storeToRefs } from "pinia";
import type { Organisation } from "@/types/organisation.type";
import { useDeviceStore } from "@/stores/deviceStore";
import { useVueSelectStyles } from "@/composables/useVueSelectStyles";


const vueSelectStyles = useVueSelectStyles();

// - Store -------------------------------------------------------------

const organisationStore = useOrganisationStore();
const deviceStore = useDeviceStore();


// - Data --------------------------------------------------------------
const confirmOn = ref(false);

const name = ref<null | string>(null);
const asset_type = ref<null | string>('vehicle');
const organisation_id = ref<null | string>(null);
const device_id =  ref<null | string>(null);

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
  const orgId = organisation_id.value;

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
		organisation_id.value = val.id
	}
},{
	immediate: true
});

// - Methods -----------------------------------------------------------

function clearMessage() {
}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly

</style>