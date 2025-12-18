<template>
	<form class="vform mt-16" autocomplete="off" @click="clearMessage">

		<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

			<!-- First Name -->
			<div class="vform__group mb-7">
				<label class="vform__label" for="first_name">First Name <span class="vform__required">*</span></label>
				<input v-model.trim="form.first_name" :class="{ 'vform__input--error': errors.first_name }"
					class="vform__input" id="first_name" type="text" placeholder="Enter first name"
					:disabled="confirmOn">
				<p class="vform__error">{{ errors.first_name }}</p>
			</div>

			<!-- Last Name -->
			<div class="vform__group mb-7">
				<label class="vform__label" for="last_name">Last Name <span class="vform__required">*</span></label>
				<input v-model.trim="form.last_name" :class="{ 'vform__input--error': errors.last_name }"
					class="vform__input" id="last_name" type="text" placeholder="Enter last name" :disabled="confirmOn">
				<p class="vform__error">{{ errors.last_name }}</p>
			</div>

		</div>

		<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

			<!-- Email -->
			<div class="vform__group mb-7">
				<label class="vform__label" for="email">Email <span class="vform__required">*</span></label>
				<input v-model.trim="form.email" :class="{ 'vform__input--error': errors.email }" class="vform__input"
					id="email" type="email" placeholder="Enter email address" autocomplete="email"
					:disabled="confirmOn">
				<p class="vform__error">{{ errors.email }}</p>
			</div>

			<!-- Password -->
			<div class="vform__group mb-7">
				<label class="vform__label" for="password">Password</label>
				<input v-model="form.password" :class="{ 'vform__input--error': errors.password }" class="vform__input"
					id="password" type="password" placeholder="Leave empty to auto-generate" autocomplete="new-password"
					:disabled="confirmOn">
				<p class="vform__error">{{ errors.password }}</p>
			</div>

		</div>

		<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

			<!-- Active Status -->
			<div class="vform__group mb-7">
				<label class="vform__label" for="active">Active <span class="vform__required">*</span></label>
				<VueSelect v-model="form.active" class="vform__group" :shouldAutofocusOption="false"
					:isDisabled="confirmOn" :style="[vueSelectStyles, selectErrorStyle(!!errors.status)]" :options="[
						{ label: 'Yes', value: true },
						{ label: 'No', value: false }
					]" placeholder="" />
				<p class="vform__error">{{ errors.active }}</p>
			</div>

			<!-- Role -->
			<div class="vform__group mb-7">
				<label class="vform__label" for="role">Role <span class="vform__required">*</span></label>
				<VueSelect v-model="form.role" class="vform__group" :shouldAutofocusOption="false"
					:isDisabled="confirmOn" :style="[vueSelectStyles, selectErrorStyle(!!errors.role)]"
					:options="roleOptions" placeholder="" />
				<p class="vform__error">{{ errors.role }}</p>
			</div>

		</div>

		<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">
			<div class="vform__group mb-7">
                <label class="vform__label" for="organisation_id">Organisation<span
                        class="vform__required">*</span></label>
                <VueSelect v-model="form.organisation_id" :shouldAutofocusOption="false" :isDisabled="confirmOn"
                    class="vform__group" :style="[vueSelectStyles, selectErrorStyle(!!errors.organisation_id)]"
                    :options="getOrganisations" placeholder="" id="organisation_id" />
                <p class="vform__error">{{ errors.organisation_id }}</p>
            </div>
		</div>

		<UserPermissions :confirmOn="confirmOn" :defaultPermissions="defaultPermissions"
			@perm-changed="form.permissions = $event">
		</UserPermissions>

		<UserOrganisations :confirmOn="confirmOn" :defaultOrganisations="defaultOrganisations"  @org-changed="form.organisations = $event">
		</UserOrganisations>

		<UserAssets :confirmOn="confirmOn" :defaultAssets="defaultAssets" @assets-changed="form.assets = $event">
		</UserAssets>

		<UserDevices :confirmOn="confirmOn" :defaultDevices="defaultDevices"  @devices-changed="form.devices = $event">
		</UserDevices>

		<div class="vform__row mt-9 ">
			<button v-if="!confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="initCreateUser">Register User</button>
			<button v-if="confirmOn" class="vbtn vbtn--zinc-lt mt-3" @click.prevent="confirmOn = false">Cancel</button>
			<button v-if="confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="createUser">Confirm</button>
		</div>

	</form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import { useMessageStore } from '@/stores/messageStore';
import { computed, reactive, ref, watch } from 'vue';
import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";


import UserPermissions from "@/components/users/UserPermissions.vue";
import UserOrganisations from "@/components/users/UserOrganisations.vue";
import UserAssets from "@/components/users/UserAssets.vue";
import UserDevices from "@/components/users/UserDevices.vue";

import { usePermissionStore } from "@/stores/permissionStore";
import { useOrganisationStore } from "@/stores/organisationStore";
import { useDeviceStore } from "@/stores/deviceStore";
import { useAssetStore } from "@/stores/assetStore";
import * as utils from "@/utils/utils";
import { useUserStore } from "@/stores/userStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useFormErrorHandler } from "@/composables/useFormErrorHandler";
import { useUserAssignableStore } from "@/stores/userAssignableStore";


// - Composable --------------------------------------------------------

const vueSelectStyles = useVueSelectStyles();

const errors = ref<Record<string, string>>({
	first_name: '',
	last_name: '',
	email: '',
	password: '',
	role: "",
	active: "",
	organisation_id: '',
});

const {handleFormError} = useFormErrorHandler(errors);

// - Store -------------------------------------------------------------

const userStore = useUserStore();
const messageStore = useMessageStore();
const permissionStore = usePermissionStore();
const dashboardStore = useDashboardStore();
const organisationStore = useOrganisationStore();
const userAssignableStore = useUserAssignableStore();

// - Data --------------------------------------------------------------

const confirmOn = ref(false);

const roleOptions = [
	{ label: 'System Admin', value: 1 },
	{ label: 'Admin', value: 2 },
	{ label: 'User', value: 3 },
	{ label: 'Viewer', value: 4 },
];

const form = reactive({
	first_name: null as null | string,
	last_name: null as null | string,
	email: null as null | string,
	password: null as null | string,
	role: 3,
	active: true,
	organisation_id: null as null | string,
	permissions: [] as number[],
	organisations: [] as string[],
	assets: [] as string[],
	devices: [] as string[],
});

const defaultPermissions = ref<number[]>([]);
const defaultOrganisations = ref<string[]>([]);
const defaultAssets = ref<string[]>([]);
const defaultDevices = ref<string[]>([]);

// - Computed ----------------------------------------------------------

const getOrganisations = computed(() => {
    const orgs = organisationStore.getOrganisationScope || {};

    return Object.values(orgs).map((o: any) => ({
        label: o.name,
        value: o.id,
    }));
});

// - Watch -------------------------------------------------------------

watch(()=>form.organisation_id, async (id) => {

	if (!id || isNaN(Number(id))) return;

	await userAssignableStore.fetchAssignableResources(id);

}, {
	immediate: true,
	deep: true
});


watch(()=>userAssignableStore.getSelectedOrgId, (id)=>{

		const assets = userAssignableStore.getAssignableResources[id]?.assets ?? {};
		defaultAssets.value = Object.keys(assets);

		const orgs = userAssignableStore.getAssignableResources[id]?.organisation ?? {};
		defaultOrganisations.value = Object.keys(orgs);			

		const devices = userAssignableStore.getAssignableResources[id]?.devices ?? {};
		defaultDevices.value = Object.keys(devices);


}, {
	immediate: true,
	deep: true
});

watch(() => [form.role, permissionStore.isLoaded], ([_, loaded]) => {

	if (!loaded) return;

	if (form.role && Number(form.role) > 0) {

		let rp = permissionStore.getRolePermissions[form.role];

		defaultPermissions.value = rp;

		form.permissions = rp;
	}
}, {
	immediate: true,
	deep: true
});


watch(()=>organisationStore.getOrganisation, (org) => {    
	form.organisation_id = org?.id ?? null;
}, {
	immediate: true,
	deep: true
});


// - Methods -----------------------------------------------------------

function clearMessage() {
	messageStore.clearFlashMessageList();
}

function initCreateUser() {
	errors.value = {
		first_name: '',
		last_name: '',
		email: '',
		password: '',
		role: "",
		active: "",
		organisation_id: '',
	};
	
	clearMessage();
	confirmOn.value = true;
}

async function createUser() {

	dashboardStore.setIsLoading(true);
	
	try {
		const {
			permissions,
			organisations,
			assets,
			devices,
			...rawCoreFields
		} = form;

		const coreFields: { [key: string]: any } = { ...rawCoreFields };

		if (!coreFields.password || coreFields.password.trim() === "") {
			delete coreFields.password;
		}

		const rolePermissions = permissionStore.getRolePermissions[form.role];
		const user_permissions = utils.diffArraysToBooleanMap(rolePermissions, permissions);

		const user_organisation_access = utils.diffArraysToBooleanMap(defaultOrganisations.value, organisations);
		const user_asset_access = utils.diffArraysToBooleanMap(defaultAssets.value, assets);
		const user_device_access = utils.diffArraysToBooleanMap(defaultDevices.value, devices);


		const payload: Record<string, any> = {
			...coreFields,
			user_permissions,
			user_organisation_access,
			user_asset_access,
			user_device_access,
		};

		const r = await userStore.createUser(payload);

        // Success message
        messageStore.setFlashMessagesList([r.data.message], 'flash-message--blue');

		userStore.addUserToStore(r.data.data.user);

		// Reset form fields to defaults     
        Object.assign(form, {
			first_name: null,
			last_name: null,
			email: null,
			password: null,
        });

	} catch (err) {

		handleFormError(err);
		console.error("! UserCreateView createUser !", err);
		
	} finally {
		confirmOn.value = false;
		dashboardStore.setIsLoading(false);
		
	}
}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
/* Make Treeselect visually match your .vform__input look & feel */
</style>