<template>
    <form class="vform mt-16" autocomplete="off">
        <TheFlashMessage></TheFlashMessage>

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }" @click="clearMessage">
            <div class="vform__group mb-7">
                <label class="vform__label" for="device_id">Name <span class="vform__required">*</span></label>
                <input v-model.trim="form.name" :class="{ 'vform__input--error': errors.name }" class="vform__input"
                    id="device_id" type="text" placeholder="Enter organisation name" :disabled="confirmOn">
                <p class="vform__error">{{ errors.name }}</p>
            </div>

            <div class="vform__group mb-7">
                <label class="vform__label" for="parent_org_id">Parent Organisation<span
                        class="vform__required">*</span></label>
                <VueSelect v-model="form.parent_org_id" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                    class="vform__group" :style="[vueSelectStyles, selectErrorStyle(!!errors.parent_org_id)]"
                    :options="getOrganisations" placeholder="" id="parent_org_id" />
                <p class="vform__error">{{ errors.parent_org_id }}</p>
            </div>
        </div>

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }" @click="clearMessage">

            <div class="vform__group mb-7">
                <label class="vform__label">Can inherit Maps API key<span class="vform__required">*</span></label>
                <VueSelect v-model="form.can_inherit_key" class="vform__group" :shouldAutofocusOption="false"
                    :isDisabled="confirmOn" :style="[vueSelectStyles, selectErrorStyle(!!errors.status)]" :options="[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false },
                    ]" placeholder="" />
                <p class="vform__error">{{ errors.status }}</p>
            </div>

            <div class="vform__group mb-7">
                <label class="vform__label" for="device_id">Maps Api key </label>
                <input v-model.trim="form.maps_api_key" :class="{ 'vform__input--error': errors.maps_api_key }"
                    class="vform__input" id="device_id" type="text"
                    :placeholder="form.can_inherit_key ? 'Leave blank to inherit from parent' : 'Enter Maps API key'"
                    :disabled="confirmOn">
                <p class="vform__error">{{ errors.maps_api_key }}</p>
            </div>

        </div>

        <!-- Row 5: Buttons -->
        <div class="vform__row mt-9">
            <button v-if="!confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="initUpdateOrganisation" type="button">Update
                Device</button>
            <button v-if="confirmOn" class="vbtn vbtn--zinc-lt mt-3" @click.prevent="confirmOn = false"
                type="button">Cancel</button>
            <button v-if="confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="updateOrganisation" type="button">Confirm</button>
        </div>
    </form>


</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';
import { useFormErrorHandler } from '@/composables/useFormErrorHandler';

import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";
import { useMessageStore } from '@/stores/messageStore';
import { useOrganisationStore } from '@/stores/organisationStore';
import { computed, onMounted, reactive, ref, toRaw, watch } from 'vue';
import { storeToRefs } from "pinia";
import type { Organisation } from "@/types/organisation.type";
import { useDashboardStore } from "@/stores/dashboardStore";


// - Composable --------------------------------------------------------

const vueSelectStyles = useVueSelectStyles();

const errors = ref<Record<string, string>>({
    name: '',
    parent_org_id: '',
    can_inherit_key: '',
    maps_api_key: '',
});

const { handleFormError } = useFormErrorHandler(errors);

// - Props -------------------------------------------------------------

const props = defineProps<{
    organisationUuid?: string | null;
}>();

// - Store -------------------------------------------------------------

const messageStore = useMessageStore();
const organisationStore = useOrganisationStore();
const { getOrgScopeByUUID, getOrganisation } = storeToRefs(organisationStore);

const dashboardStore = useDashboardStore();

// - Data --------------------------------------------------------------

const confirmOn = ref(false);

type Form = typeof form;

const form = reactive({
    id: null as null | string,
    name: null as null | string,
    parent_org_id: null as null | string,
    can_inherit_key: true,
    maps_api_key: null as null | string,
});

const organisation = ref<null | Organisation>(null);


// - Computed ----------------------------------------------------------

const getOrganisations = computed(() => {
    let  orgs = organisationStore.getOrganisationScope || {};



    return Object.values(orgs)
    .filter((org: Organisation) => org.uuid != props.organisationUuid)
    .map((o: any) => ({
        label: o.name,
        value: o.id,
    }));
});

// - Watchers ----------------------------------------------------------
watch([() => props.organisationUuid, getOrgScopeByUUID], ([uuid, orgScope]) => {

    if (!uuid) return;

    const org = orgScope[uuid];

    if (!org) return;

    organisation.value = org;

    form.id = org.id;
    form.name = org.name;
    form.parent_org_id = org.parent_org_id ?? null;
    form.can_inherit_key = org.can_inherit_key ?? true;

}, {
    immediate: true,
});

// - Methods -----------------------------------------------------------

function clearMessage() {
    messageStore.clearFlashMessageList();
}

function initUpdateOrganisation() {
    confirmOn.value = true;

    errors.value = {
        name: '',
        parent_org_id: '',
        can_inherit_key: '',
        maps_api_key: '',
    };
}

// normalize helpers
const norm = (v: unknown) => (v === '' || v === undefined ? null : v);
const same = (a: unknown, b: unknown) => String(a ?? '') === String(b ?? '');


function buildUpdatePayload(form: Form, current: Organisation) {
    const payload: Record<string, any> = {};

    const {
        id: _omitId,
        ...coreFields
    } = toRaw(form);

    const coreKeys = Object.keys(coreFields) as Array<keyof typeof coreFields>;

    for (let key of coreKeys) {
        const newVal = norm(coreFields[key] as unknown);

        const curVal = norm((current as any)[key]);

        if (!same(newVal, curVal)) {
            payload[key as string] = coreFields[key];
        }

        // Pleceholder for Att see DeviceUpdateView.vue
    }

    return payload;
}


async function updateOrganisation() {
    if (!organisation.value) return;

    const payload = buildUpdatePayload(form, organisation.value);

    if (Object.keys(payload).length === 0) {
        messageStore.setFlashMessagesList(
            ['No changes detected.'],
            'flash-message--orange'
        );
        confirmOn.value = false;
        return;
    }

    try {
        dashboardStore.setIsLoading(true);

        const r = await organisationStore.updateOrganisation(organisation.value.id, payload);

        if (r?.data?.data?.organisations) {

            r.data.data.organisations.forEach((org: Organisation) => {
                organisationStore.addOrganisationToScope(org);
            });
            

            messageStore.setFlashMessagesList([r.data.message], 'flash-message--blue');
        }

    } catch (err) {
        handleFormError(err);
		console.error("! OrgUpdateView updateOrganisation !", err);

    } finally {
        confirmOn.value = false;
        dashboardStore.setIsLoading(false);
    }
}
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly</style>