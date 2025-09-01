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
                <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group"
                    :style="vueSelectStyles" v-model="asset_type" :options="[
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
                <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group"
                    :style="vueSelectStyles" v-model="organisation_id" :options="getOrganisations" placeholder="" />
                <p class="vform__error">{{ errors.organisation_id }}</p>
            </div>
            <div class="vform__group mt-7">
                <label class="vform__label">Device<span class="vform__required">*</span></label>
                <VueSelect :shouldAutofocusOption="false" :isDisabled="confirmOn" class="vform__group"
                    :style="vueSelectStyles" v-model="device_id" :options="getDevices" placeholder="" />
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
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import VueSelect from 'vue3-select-component';

import { useVueSelectStyles } from '@/composables/useVueSelectStyles';
import { useAssetStore } from '@/stores/assetStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { useOrganisationStore } from '@/stores/organisationStore';
import type { Asset } from '@/types/asset.type';
import type { Device } from '@/types/device.type';

const vueSelectStyles = useVueSelectStyles();

const assetStore = useAssetStore();
const deviceStore = useDeviceStore();
const organisationStore = useOrganisationStore();

const { getAssets, uuidToIdMap } = storeToRefs(assetStore);

const props = defineProps<{
    assetUuid?: string | null;
}>();


// - State -------------------------------------------------------------

const confirmOn = ref(false);

const name = ref<string | null>(null);
const asset_type = ref<string | null>('vehicle');
const organisation_id = ref<string | null>(null);
const device_id = ref<string | null>(null);
const attached_device_id = ref<string | null>(null);



// Single sentinel representing "no device linked"
const NO_DEVICE = '-1';

const errors = ref<Record<string, string>>({
    name: '',
    asset_type: '',
    organisation_id: '',
    device_id: '',
});


//  - Computed ---------------------------------------------------------

const getOrganisations = computed(() => {
    const orgs = organisationStore.getOrganisationScope || {};
    return Object.values(orgs).map((o: any) => ({
        label: o.name,
        value: String(o.id),
    }));
});

const getDevices = computed(() => {
  const devices = deviceStore.getDevices ?? {};
  const orgId = organisation_id.value;

  // No organisation selected yet
  if (!orgId) {
    return [
      {
        label: 'Select an organisation to see devices.',
        value: NO_DEVICE,
        disabled: true,
      },
    ];
  }

  // List all devices in this org that are not assigned to any asset
  const availableDevices: any[] = Object.values(devices)
    .filter((d: any) => String(d.organisation_id) === String(orgId) && d.asset_id == null)
    .map((d: any) => ({
      label: d.model
        ? `${d.model} ${d.external_id}`
        : `${d.vendor} ${d.external_id}`,
      value: String(d.id),
    }));

  // If the asset has a device attached, always show it at the top, marked as Linked
  if (attached_device_id.value && devices[attached_device_id.value]) {
    const d = devices[attached_device_id.value];
    availableDevices.unshift({
      label: d.model
        ? `${d.model} ${d.external_id} — Linked`
        : `${d.vendor} ${d.external_id} — Linked`,
      value: String(d.id),
    });
  }

  // Show "Detach device" or "No device linked" at the top
  const hasLinkedDevice = device_id.value !== null && device_id.value !== NO_DEVICE;
  if (hasLinkedDevice) {
    availableDevices.unshift({
      label: 'Detach device from asset',
      value: NO_DEVICE,
    });
  } else {
    availableDevices.unshift({
      label: 'No device linked',
      value: NO_DEVICE,
      disabled: true,
    });
  }

  // If only the attached device and "Detach"/"No device linked" are present,
  // there are no available devices for assignment
  if (availableDevices.length === 2) {
    return [
      {
        label:
          'No available devices. Select another organisation or update a device.',
        value: NO_DEVICE,
        disabled: true,
      },
      ...availableDevices,
    ];
  }

  return availableDevices;
});


// - Watchers ----------------------------------------------------------

watch(
    [() => props.assetUuid, getAssets, uuidToIdMap],
    ([assetUuid, assets, idMap]) => {
        if (assets && assetUuid) {

            const a: any = assets[idMap[assetUuid]];

            if (a) {
                name.value = a.name ?? null;
                asset_type.value = a.asset_type ?? null;
                organisation_id.value = a.organisation_id != null ? String(a.organisation_id) : null;

                let loadedDeviceId = NO_DEVICE;
           
                if (Array.isArray(a.devices) && a.devices.length > 0 && a.devices[0].id) {                 
                    loadedDeviceId = String(a.devices[0].id);
                }

                device_id.value = loadedDeviceId;
                attached_device_id.value = loadedDeviceId;
            }
        }
    },
    { immediate: true }
);


// - Methods -----------------------------------------------------------

function clearMessage() {
    // no-op placeholder
}
</script>


<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly</style>