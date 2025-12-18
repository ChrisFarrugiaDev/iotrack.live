<template>
    <form class="vform mt-16" autocomplete="off">
        <TheFlashMessage></TheFlashMessage>

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }" @click="clearMessage">
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

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }" @click="clearMessage">


			<!-- Email -->
			<div class="vform__group mb-7">
				<label class="vform__label" for="email">Email <span class="vform__required">*</span></label>
				<input v-model.trim="form.email" :class="{ 'vform__input--error': errors.email }" class="vform__input"
					id="email" type="email" placeholder="Enter email address" autocomplete="email"
					:disabled="confirmOn">
				<p class="vform__error">{{ errors.email }}</p>
			</div>

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
        </div>

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">



			<!-- Role -->
			<div class="vform__group mb-7" @click="roleChangedByUser = true">
				<label class="vform__label" for="role">Role <span class="vform__required">*</span></label>
				<VueSelect v-model="form.role_id" class="vform__group" :shouldAutofocusOption="false"
					:isDisabled="confirmOn" :style="[vueSelectStyles, selectErrorStyle(!!errors.role)]"
					:options="roleOptions" placeholder="" />
				<p class="vform__error">{{ errors.role }}</p>
			</div>


            <div class="vform__group mb-7" @click="organisationChangedByUser = true">
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

		<UserOrganisations :confirmOn="confirmOn" 
			:defaultOrganisations="defaultOrganisations"  @org-changed="form.organisations = $event">
		</UserOrganisations>

		<UserAssets :confirmOn="confirmOn" 
			:defaultAssets="defaultAssets" @assets-changed="form.assets = $event">
		</UserAssets>

		<UserDevices :confirmOn="confirmOn" 
			:defaultDevices="defaultDevices"  @devices-changed="form.devices = $event">
		</UserDevices>


    </form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import TheFlashMessage from '@/components/commen/TheFlashMessage.vue';
import { useFormErrorHandler } from '@/composables/useFormErrorHandler';
import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";
import { useMessageStore } from '@/stores/messageStore';
import { useUserStore } from '@/stores/userStore';
import type { User } from '@/types/user.type';
import { storeToRefs } from 'pinia';
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useOrganisationStore } from "@/stores/organisationStore";
import UserPermissions from "@/components/users/UserPermissions.vue";
import { usePermissionStore } from "@/stores/permissionStore";
import UserOrganisations from "@/components/users/UserOrganisations.vue";
import UserDevices from "@/components/users/UserDevices.vue";
import UserAssets from "@/components/users/UserAssets.vue";
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

const { handleFormError } = useFormErrorHandler(errors);

// - Props -------------------------------------------------------------

const props = defineProps<{
    userUuid?: string | null;
}>();

// - Store -------------------------------------------------------------

const messageStore = useMessageStore();

const userStore = useUserStore();
const { getUserScopeByUuid } = storeToRefs(userStore);

const organisationStore = useOrganisationStore();

const permissionStore = usePermissionStore();

const userAssignableStore = useUserAssignableStore();


// - Data --------------------------------------------------------------

const confirmOn = ref(false);

const roleOptions = [
	{ label: 'System Admin', value: 1 },
	{ label: 'Admin', value: 2 },
	{ label: 'User', value: 3 },
	{ label: 'Viewer', value: 4 },
];

type Form = typeof form;

const form = reactive({
	first_name: null as null | string,
	last_name: null as null | string,
	email: null as null | string,
	password: null as null | string,
	role_id: null as null | number,
	active: true,
	organisation_id: null as null | string,
	permissions: [] as number[],
	organisations: [] as string[],
	assets: [] as string[],
	devices: [] as string[],
});

const user = ref<null | User>(null);

const defaultPermissions = ref<number[]>([]);
const defaultOrganisations = ref<string[]>([]);
const defaultAssets = ref<string[]>([]);
const defaultDevices = ref<string[]>([]);


// Track user-initiated changes only.
// Without these flags, watchers would run when form values are set
// programmatically (e.g. on edit load), causing permissions/assets
// to be recalculated incorrectly.
const roleChangedByUser = ref(false);
const organisationChangedByUser  = ref(false);



// - Computed ----------------------------------------------------------

const getOrganisations = computed(() => {
    const orgs = organisationStore.getOrganisationScope || {};

    return Object.values(orgs).map((o: any) => ({
        label: o.name,
        value: o.id,
    }));
});

// - Watchers ----------------------------------------------------------

// When organisation_id changes, load assignable: assets, devices and organisations for that organisation
watch(()=>form.organisation_id, async (id) => {
	if (!id || isNaN(Number(id))) return;
	await userAssignableStore.fetchAssignableResources(id);
}, {
	deep: true
});

// Populate form and base context when editing a user
// (runs on initial mount or when userUuid changes)
watch([() => props.userUuid, getUserScopeByUuid], async ([uuid, userScope]) =>{

    if (!uuid) return;

    const uu = userScope[uuid]

    if (!uu) return;

    // Preload assignable resources for user's organisation
	await userAssignableStore.fetchAssignableResources(uu.organisation_id!);

    user.value = uu;

    form.first_name = uu.first_name;
    form.last_name = uu.last_name;
    form.email = uu.email;
    form.active = uu.active;
    form.role_id = uu.role_id;
    form.organisation_id = uu.organisation_id;

}, {
    immediate: true,
});

// Load user-specific assignments (permissions, orgs, assets, devices)
// Uses cache first, falls back to API on first load
watch(
    () => user.value,
    async (u) => {
        if (!u) return;

        const userId = u.id;

        // Permissions
        let perms = userStore.getUserPermissionsById(userId);
        if (perms.length === 0) {
            perms = await userStore.fetchUserPermissions(userId);
        }
        defaultPermissions.value = [...perms];
        form.permissions = [...perms];

        // Assets
        let assets = userStore.getUserAssetsById(userId);
        if (assets.length === 0) {
            assets = await userStore.fetchUserAssets(userId);
        }
        defaultAssets.value = [...assets];

        // Organisations
        let orgs = userStore.getUserOrganisationsById(userId);
        if (orgs.length === 0) {
            orgs = await userStore.fetchUserOrganisations(userId);
        }
        defaultOrganisations.value = [...orgs];

        // Devices
        let devices = userStore.getUserDevicesById(userId);
        if (devices.length === 0) {
            devices = await userStore.fetchUserDevices(userId);
        }
        defaultDevices.value = [...devices];
    },
    { immediate: true }
);

// Update assignable assets/devices when the user explicitly changes organisation
// (prevents overwriting user assignments during initial load)
watch(
    () => userAssignableStore.getSelectedOrgId,
    (orgId) => {
        if (!orgId) return;

        if (!organisationChangedByUser.value) return;

        const assignable =
            userAssignableStore.getAssignableResources[orgId] ?? {};

        defaultAssets.value = Object.keys(assignable.assets ?? {});
        defaultDevices.value = Object.keys(assignable.devices ?? {});
        defaultOrganisations.value = Object.keys(assignable.organisation ?? {})
            .filter(o => o !== orgId);
    }
);

// Reset permissions to role defaults ONLY when role is changed by the user
// (avoids overriding permissions on edit load)
watch(
    () => form.role_id,
    (newRoleId, oldRoleId) => {
        
        if (!roleChangedByUser.value) return;

        if (!permissionStore.isLoaded) return;
        if (!newRoleId) return;
        if (newRoleId === oldRoleId) return;

        const rolePerms = permissionStore.getRolePermissions[newRoleId];

        defaultPermissions.value = [...rolePerms];
        form.permissions = [...rolePerms];
    }
);


// - Methods -----------------------------------------------------------

function clearMessage() {
    messageStore.clearFlashMessageList();
}


</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>