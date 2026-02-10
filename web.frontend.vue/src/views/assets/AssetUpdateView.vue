<template>
    <form class="vform mt-16" autocomplete="off">
        <TheFlashMessage></TheFlashMessage>

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }" @click="clearMessage">
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

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }" @click="clearMessage">
            <div class="vform__group mt-7">
                <label class="vform__label">Organisation<span class="vform__required">*</span></label>
                <VueSelect v-model="form.organisation_id" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.organisation_id)]" class="vform__group"
                    :options="getOrganisations" placeholder="" />
                <p class="vform__error">{{ errors.organisation_id }}</p>
            </div>
            <div class="vform__group mt-7">
                <label class="vform__label">Device</label>
                <VueSelect v-model="form.device_id" :shouldAutofocusOption="false" :isDisabled="confirmOn || !authorizationStore.can('asset.assign-device')"
                    :style="[vueSelectStyles, selectErrorStyle(!!errors.device_id)]" class="vform__group"
                    :options="getDevices" placeholder="" />
                <p class="vform__error">{{ errors.device_id }}</p>
            </div>
        </div>


        <div class="vheading--4 mt-12 mb-2">Settings</div>
		<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
			<div class="vform__group mt-7">
				<label class="vform__label">
					Speed Units<span class="vform__required">*</span>
				</label>

				<VueSelect
					v-model="form.speed_units"
					:shouldAutofocusOption="false"
					:isDisabled="confirmOn"
					:style="[vueSelectStyles, selectErrorStyle(!!errors.speed_units)]"
					class="vform__group"
					:options="[
						{ label: 'km/h', value: 'kmh' },
						{ label: 'mph', value: 'mph' },
						{ label: 'knots', value: 'knots' },
						{ label: 'm/s', value: 'ms' }
					]"
					placeholder=""
				/>

				<p class="vform__error">{{ errors.speed_units }}</p>
			</div>
			<div class="vform__group mt-7"></div>
		</div>

        <!-- Vehicle fields -->
        <div v-if="form.asset_type == 'vehicle'">
            <div class="vheading--4 mt-12 mb-2">Vehicle</div>

            <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
                <div class="vform__group mt-7">
                    <label class="vform__label">Registration No.</label>
                    <input v-model="form.vehicle.registration_number" class="vform__input" type="text"
                        placeholder="e.g. ABC-123" :disabled="confirmOn">
                </div>
                <div class="vform__group mt-7">
                    <label class="vform__label">Make</label>
                    <input v-model="form.vehicle.make" class="vform__input" type="text" placeholder="Enter make"
                        :disabled="confirmOn">
                </div>
            </div>

            <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
                <div class="vform__group mt-7">
                    <label class="vform__label">Model</label>
                    <input v-model="form.vehicle.model" class="vform__input" type="text" placeholder="Enter model"
                        :disabled="confirmOn">
                </div>
                <div class="vform__group mt-7">
                    <label class="vform__label">Year</label>
                    <input v-model="form.vehicle.year" class="vform__input" type="number" placeholder="Enter year"
                        :disabled="confirmOn">
                </div>
            </div>

            <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
                <div class="vform__group mt-7">
                    <label class="vform__label">Color</label>
                    <input v-model="form.vehicle.color" class="vform__input" type="text" placeholder="Enter color"
                        :disabled="confirmOn">
                </div>
                <div class="vform__group mt-7">
                    <label class="vform__label">Fuel Type</label>
                    <input v-model="form.vehicle.fuel_type" class="vform__input" type="text"
                        placeholder="Enter fuel type" :disabled="confirmOn">
                </div>
            </div>
        </div>


        <!-- Personal fields -->
        <div v-if="form.asset_type == 'personal'">
            <div class="vheading--4 mt-12 mb-2">Personal</div>

            <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
                <div class="vform__group mt-7">
                    <label class="vform__label">Full Name</label>
                    <input v-model="form.personal.full_name" class="vform__input" type="text"
                        placeholder="Enter full name" :disabled="confirmOn">
                </div>
                <div class="vform__group mt-7">
                    <label class="vform__label">Phone Number</label>
                    <input v-model="form.personal.phone_number" class="vform__input" type="text"
                        placeholder="e.g. +356 9999 9999" :disabled="confirmOn">
                </div>
            </div>

            <div class="vform__group--textarea mt-7 w-full">
                <label class="vform__label">Info</label>
                <textarea v-model="form.personal.info" class="vform__input vform__input--textarea"
                    placeholder="Additional information" rows="3" :disabled="confirmOn"></textarea>
            </div>
        </div>

        <!-- Asset fields -->
        <div v-if="form.asset_type == 'asset'">
            <div class="vheading--4 mt-12 mb-2">Equipment / Asset</div>
            <div class="vform__group--textarea mt-7 w-full">
                <label class="vform__label">Info</label>
                <textarea v-model="form.asset.info" class="vform__input vform__input--textarea"
                    placeholder="Additional information" rows="3" :disabled="confirmOn"></textarea>
            </div>
        </div>

        <div class="vform__row mt-9 ">
            <button v-if="!confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="initUpdateAsset">
                Update Asset
            </button>
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
import { useDashboardStore } from '@/stores/dashboardStore';
import { useFormErrorHandler } from '@/composables/useFormErrorHandler';
import { useAuthorizationStore } from '@/stores/authorizationStore';


const vueSelectStyles = useVueSelectStyles();

const errors = ref<Record<string, string>>({
    name: '',
    asset_type: '',
    organisation_id: '',
    device_id: '',
});

const { handleFormError } = useFormErrorHandler(errors);

// -Types --------------------------------------------------------------

type Form = typeof form;

// - Store -------------------------------------------------------------

const assetStore = useAssetStore();
const deviceStore = useDeviceStore();
const organisationStore = useOrganisationStore();
const messageStore = useMessageStore();
const dashboardStore = useDashboardStore();

const { getAssets, uuidToIdMap } = storeToRefs(assetStore);

const authorizationStore = useAuthorizationStore();

// - Props -------------------------------------------------------------

const props = defineProps<{
    assetUuid?: string | null;
}>();



// - Data --------------------------------------------------------------

const confirmOn = ref(false);

const asset = ref<null | Asset>(null);

const form = reactive({
    name: null as null | string,
    asset_type: 'vehicle' as string,      // default
    organisation_id: null as null | string,
    device_id: null as null | string,     // optional: attach a device
    _device_id: null as null | string,

    speed_units: '' as string,

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


// Single sentinel representing "no device linked"
const NO_DEVICE = '-1';




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
    if (form._device_id && devices[form._device_id]) {
        const d = devices[form._device_id];
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

        if (!assetUuid || !assets || !idMap) return;


        const assetId = idMap[assetUuid];
        const a: any = assets[assetId];

        if (!a) return;

        // Top-level fields
        form.name = a.name ?? null;
        form.asset_type = a.asset_type ?? 'vehicle';
        form.organisation_id = a.organisation_id != null ? String(a.organisation_id) : null;

        // Devices
        let loadedDeviceId = NO_DEVICE;
        if (Array.isArray(a.devices) && a.devices.length > 0 && a.devices[0].id) {
            loadedDeviceId = String(a.devices[0].id);
        }

        form.device_id = loadedDeviceId;
        form._device_id = loadedDeviceId;


        // Attributes - load safely with fallback for missing keys
        const attrs = a.attributes ?? {}; 

        form.speed_units = attrs?.speed_units ?? 'kmh'

        Object.assign(form.vehicle, {
            registration_number: attrs.vehicle?.registration_number ?? null,
            make: attrs.vehicle?.make ?? null,
            model: attrs.vehicle?.model ?? null,
            year: attrs.vehicle?.year ?? null,
            color: attrs.vehicle?.color ?? null,
            fuel_type: attrs.vehicle?.fuel_type ?? null,
        });

        Object.assign(form.personal, {
            full_name: attrs.personal?.full_name ?? null,
            phone_number: attrs.personal?.phone_number ?? null,
            info: attrs.personal?.info ?? null,
        });

        Object.assign(form.asset, {
            info: attrs.asset?.info ?? null,
        });

        asset.value = a;

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
        _device_id: _omitId,
        ...coreFields
    } = toRaw(form);

    const coreKeys = Object.keys(coreFields) as Array<keyof typeof coreFields>;

    for (let key of coreKeys) {
        // form values might be strings; device values might be numbers/nulls; normalize before compare
        const newVal = norm(coreFields[key] as unknown);

        const curVal = norm((current as any)[key]);

        if (key == 'device_id') {
            continue
        }

        if (!same(newVal, curVal)) {
            payload[key as string] = coreFields[key];
        }
    }

    // - Device ID update logic ------------------------

    if (asset.value?.devices.length) {
        // Asset currently has a device linked
        const currentDeviceId = String(asset.value.devices[0].id);
        const isDetach = [null, "-1", 0, "0"].includes(form.device_id);

        if (isDetach) {
            // User chose to detach device
            payload["device_id"] = "0";
        } else if (String(form.device_id) !== currentDeviceId) {
            // User chose a different device (not detaching and not the same)
            payload["device_id"] = form.device_id;
        }
    } else {
        // If no device, attach if user picks valid device
        const isAttach = ![null, "-1", 0, "0"].includes(form.device_id);
        if (isAttach) {
            // User picked a device to attach
            payload["device_id"] = form.device_id;
        }
    }


    // 2) Attributes merge/diff (preserve unknown attrs, update/remove iccid/msisdn)
    const nextAttrs = { ...(current.attributes ?? {

    }) };

    if (form.asset_type === 'vehicle') {
        nextAttrs.vehicle = { ...form.vehicle };
    } else if (form.asset_type === 'personal') {
        nextAttrs.personal = { ...form.personal };
    } else if (form.asset_type === 'asset') {
        nextAttrs.asset = { ...form.asset };
    }
     nextAttrs.speed_units = form.speed_units;

     

    // only include attributes if they actually changed
    const prevAttrsJson = JSON.stringify(current.attributes ?? {});
    const nextAttrsJson = JSON.stringify(nextAttrs);
    if (prevAttrsJson !== nextAttrsJson) {
        payload.attributes = nextAttrs;
    }

    return payload;
}

async function updateAsset() {
    if (!asset.value) return;
    dashboardStore.setIsLoading(true);

    const payload = buildUpdatePayload(form, asset.value);


    if (Object.keys(payload).length == 0) {

        messageStore.setFlashMessagesList(
            ['No changes detected.'],
            'flash-message--orange'
        );
        confirmOn.value = false;
        return;
    }

    try {

        // Determine new and old device IDs for asset-device linking
        const device_id_new = (payload.device_id && payload.device_id !== '0') ? payload.device_id : null;
        const device_id_old = (payload.device_id && asset.value.devices.length) ? String(asset.value.devices[0].id) : null;

        // Update asset in backend and local store
        const r = await assetStore.updatedAsset(asset.value.id, payload);
        assetStore.addAssetToStore(r.data.data.asset);

        // Link new device to asset (if any)
        if (device_id_new) {
            deviceStore.changeDeviceAssetID(device_id_new, asset.value.id); // Link new device to asset
        }

        // Unlink old device if changed (if any)
        if (device_id_old && device_id_old !== device_id_new) {
            deviceStore.changeDeviceAssetID(device_id_old, null); // Unlink old device
        }

        // If org changed, update on device (if any)
        if (payload.organisation_id && r.data.data.asset.devices.length) {
            deviceStore.changeDeviceOrganisationID(r.data.data.asset.devices[0].id, payload.organisation_id);
        }

        // Show success message
        messageStore.setFlashMessagesList([r.data.message], 'flash-message--blue');

    } catch (err: any) {

        handleFormError(err);

        // Always log error for developer debugging
        console.error("! AssetUpdateView updateAsset !", err);
    } finally {
        confirmOn.value = false;
        dashboardStore.setIsLoading(false);
    }
}

</script>


<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly</style>