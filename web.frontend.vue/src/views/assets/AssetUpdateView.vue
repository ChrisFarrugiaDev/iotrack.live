<template>
  <form class="vform mt-16" autocomplete="off" @click="clearMessage">

    <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
      <div class="vform__group mt-7">
        <label class="vform__label" for="device_id">Asset Name<span class="vform__required">*</span></label>
        <input class="vform__input" id="device_id" type="text" placeholder="Enter asset name" v-model.trim="name"
          :disabled="confirmOn">
        <p class="vform__error">{{ errors.name }}</p>
      </div>
      <div class="vform__group mt-7">
        <label class="vform__label">Asset Type<span class="vform__required">*</span></label>
        <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles"
          v-model="asset_type" :options="[
            { label: 'Vehicle', value: 'vehicle' },
            { label: 'Equipment / Asset', value: 'asset' },
            { label: 'Personal', value: 'personal' },
          ]" placeholder="" />
        <p class="vform__error">{{ errors.asset_type }}</p>
      </div>
    </div>

    <!-- <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
      <div class="vform__group mt-7">
        <label class="vform__label">Organisation<span class="vform__required">*</span></label>
        <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles"
          v-model="organisation_id" :options="organisations" placeholder="" />
        <p class="vform__error">{{ errors.organisation_id }}</p>
      </div>
      <div class="vform__group mt-7" v-if="devices">
        <label class="vform__label">Device<span class="vform__required">*</span></label>
        <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group" :style="vueSelectStyles"
          v-model="device_id" :options="devices" placeholder="" />
        <p class="vform__error">{{ errors.device_id }}</p>
      </div>
    </div> -->

    <div class="vform__row mt-12 ">
      <button v-if="!confirmOn" class="vbtn vbtn--sky" @click.prevent="confirmOn = true">Register Asset</button>
      <button v-if="confirmOn" class="vbtn vbtn--zinc-lt" @click.prevent="confirmOn = false">Cancel</button>
      <button v-if="confirmOn" class="vbtn vbtn--sky" @click.prevent="confirmOn = false">Confirm</button>
    </div>

  </form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { useVueSelectStyles } from '@/composables/useVueSelectStyles';
import type { Device } from '@/types/device.type';
import { ref } from 'vue';
import VueSelect from 'vue3-select-component';

const vueSelectStyles = useVueSelectStyles();


const props = (defineProps<{
  devices?: Record<string, Device> | null,
  selectedDeviceUUID?: string | null,
  organisations?: Record<string, any> | null
}>());


// - Data --------------------------------------------------------------
const confirmOn = ref(false);

const name = ref<null | string>(null);
const asset_type = ref<null | string>('vehicle');
const organisation_id = ref<null | string>(null);
const device_id = ref<null | string>(null);

const errors = ref<Record<string, string>>({
  name: '',
  asset_type: '',
  organisation_id: '',
  device_id: '',
});

// - Methods -----------------------------------------------------------

function clearMessage() {
}


</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly</style>