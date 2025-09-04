<template>
    <form class="vform mt-16" autocomplete="off" >
        <TheFlashMessage></TheFlashMessage>

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }" @click="clearMessage">
            <div class="vform__group mt-7">
                <label class="vform__label" for="device_id">Asset Name<span class="vform__required">*</span></label>
                <input v-model.trim="form.name" 
                    :class="{ 'vform__input--error': errors.name }" class="vform__input" 
                    id="device_id" type="text"
                    placeholder="Enter asset name" :disabled="confirmOn">
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

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }" @click="clearMessage">
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
                <label class="vform__label">Device</label>
                <VueSelect v-model="form.device_id" 
                    :shouldAutofocusOption="false" 
                    :isDisabled="confirmOn"
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.device_id)]" class="vform__group" 
                    :options="getDevices" placeholder="" />
                <p class="vform__error">{{ errors.device_id }}</p>
            </div>
        </div>

        <div class="vform__row mt-9 ">
            <button v-if="!confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="initUpdateAsset">Register Asset</button>
            <button v-if="confirmOn" class="vbtn vbtn--zinc-lt  mt-3" @click.prevent="confirmOn = false">Cancel</button>
            <button v-if="confirmOn" class="vbtn vbtn--sky  mt-3" @click.prevent="updateAsset">Confirm</button>
        </div>

    </form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import { computed, reactive, ref, toRaw, watch } from 'vue';
import { storeToRefs } from 'pinia';
import VueSelect from 'vue3-select-component';

import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";
import { useAssetStore } from '@/stores/assetStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { useOrganisationStore } from '@/stores/organisationStore';
import { useMessageStore } from '@/stores/messageStore';
import type { Asset } from '@/types/asset.type';
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';


const vueSelectStyles = useVueSelectStyles();

// -Types --------------------------------------------------------------

type Form = typeof form;

// - Store -------------------------------------------------------------

const assetStore = useAssetStore();
const deviceStore = useDeviceStore();
const organisationStore = useOrganisationStore();
const messageStore = useMessageStore();

const { getAssets, uuidToIdMap } = storeToRefs(assetStore);

// - Props -------------------------------------------------------------

const props = defineProps<{
    assetUuid?: string | null;
}>();



// - State -------------------------------------------------------------

const confirmOn = ref(false);

const asset = ref<null | Asset>(null);

const form = reactive({
    id: null as null | string,
    name: null as null | string,
    asset_type: 'vehicle' as string,      // default
    organisation_id: null as null | string,
    device_id: null as null | string,     // optional: attach a device
});





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
    const orgId = form.organisation_id;

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
    if (form.id && devices[form.id]) {
        const d = devices[form.id];
        availableDevices.unshift({
            label: d.model
                ? `${d.model} ${d.external_id} — Linked`
                : `${d.vendor} ${d.external_id} — Linked`,
            value: String(d.id),
        });
    }

    // Show "Detach device" or "No device linked" at the top
    const hasLinkedDevice = form.device_id !== null && form.device_id !== NO_DEVICE;
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
    if (availableDevices.length === 1) {
        return [
            ...availableDevices,
            {
                label:
                    'No available devices. Select another organisation or update a device.',
                value: NO_DEVICE,
                disabled: true,
            },
            
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
                form.name = a.name ?? null;
                form.asset_type = a.asset_type ?? null;
               form.organisation_id = a.organisation_id != null ? String(a.organisation_id) : null;

                let loadedDeviceId = NO_DEVICE;

                if (Array.isArray(a.devices) && a.devices.length > 0 && a.devices[0].id) {
                    loadedDeviceId = String(a.devices[0].id);
                }

                form.device_id = loadedDeviceId;
                form.id = loadedDeviceId;

                asset.value = a;
            }
        }
    },
    { immediate: true }
);


// - Methods -----------------------------------------------------------

function clearMessage() {
    messageStore.clearFlashMessageList();
}

function initUpdateAsset() {
    confirmOn.value = true;

    errors.value = {
        name: '',
        asset_type: '',
        organisation_id: '',
        device_id: '',
    };
}

// normalize helpers
const norm = (v: unknown) => (v === '' || v === undefined ? null : v);
const same = (a: unknown, b: unknown) => String(a ?? '') === String(b ?? '');

function buildUpdatePayload(form: Form, current: Asset) {
    const payload: Record<string, any> = {};

    // 1) Top-level fields (excluding id + attributes-related inputs)
    const {
        id: _omitId,
        ...coreFields
    } = toRaw(form);

    const coreKeys = Object.keys(coreFields) as Array<keyof typeof coreFields>;

    for (let key of coreKeys) {
        // form values might be strings; device values might be numbers/nulls; normalize before compare
        const newVal = norm(coreFields[key] as unknown);

        const curVal = norm((current as any)[key]);

        if (newVal == '-1' && curVal == null && key == 'device_id') {
            continue
        }

        if (!same(newVal, curVal)) {
            payload[key as string] = coreFields[key];
        }
    }

    // 2) Attributes merge/diff (preserve unknown attrs, update/remove iccid/msisdn)
    const curAttrs = { ...(current.attributes ?? {}) };

    // placeholder for asset att - see update device
    // ...

    // only include attributes if they actually changed
    const prevAttrsJson = JSON.stringify(current.attributes ?? {});
    const nextAttrsJson = JSON.stringify(curAttrs);
    if (prevAttrsJson !== nextAttrsJson) {
        payload.attributes = curAttrs;
    }

    return payload;
}

async function updateAsset() {
    if (!asset.value) return;

    const payload = buildUpdatePayload(form, asset.value);

    if (Object.keys(payload).length == 0) {
        
        messageStore.setFlashMessagesList(
            ['No changes detected.'],
            'flash-message--orange'
        );
        confirmOn.value = false;
        return;
    }
}

</script>


<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly</style>