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

        <div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

            <!-- Password -->
            <div class="vform__group mb-7">
                <label class="vform__label" for="password">Password</label>
                <input v-model="form.password" :class="{ 'vform__input--error': errors.password }" class="vform__input"
                    id="password" type="password" placeholder="Leave blank to keep user's current password"
                    autocomplete="new-password" :disabled="confirmOn">
                <p class="vform__error">{{ errors.password }}</p>
            </div>

        </div>

        <UserPermissions :confirmOn="confirmOn" :defaultPermissions="defaultPermissions"
            @perm-changed="form.permissions = $event">
        </UserPermissions>

        <UserOrganisations :confirmOn="confirmOn" :defaultOrganisations="defaultOrganisations"
            @org-changed="form.organisations = $event">
        </UserOrganisations>

        <UserAssets :confirmOn="confirmOn" :defaultAssets="defaultAssets" @assets-changed="form.assets = $event">
        </UserAssets>

        <UserDevices :confirmOn="confirmOn" :defaultDevices="defaultDevices" @devices-changed="form.devices = $event">
        </UserDevices>


        <div class="vform__row mt-9 mb-12">
            <button v-if="!confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="initUpdateUser">Update User</button>
            <button v-if="confirmOn" class="vbtn vbtn--zinc-lt mt-3" @click.prevent="confirmOn = false">Cancel</button>
            <button v-if="confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="updateUser">Confirm</button>
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
import { useUserStore } from '@/stores/userStore';
import type { User } from '@/types/user.type';
import { storeToRefs } from 'pinia';
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, toRaw, watch } from 'vue';
import { useOrganisationStore } from "@/stores/organisationStore";
import UserPermissions from "@/components/users/UserPermissions.vue";
import { usePermissionStore } from "@/stores/permissionStore";
import UserOrganisations from "@/components/users/UserOrganisations.vue";
import UserDevices from "@/components/users/UserDevices.vue";
import UserAssets from "@/components/users/UserAssets.vue";
import { useUserAssignableStore } from "@/stores/userAssignableStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import * as utils from "@/utils/utils";

// - Store -------------------------------------------------------------

const dashboardStore = useDashboardStore();

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

const currentUserPermissions = ref<number[]>([]);
const currentUserOrganisations = ref<string[]>([]);
const currentUserAssets = ref<string[]>([]);
const currentUserDevices = ref<string[]>([]);

const defaultPermissions = ref<number[]>([]);
const defaultOrganisations = ref<string[]>([]);
const defaultAssets = ref<string[]>([]);
const defaultDevices = ref<string[]>([]);


// Track user-initiated changes only.
// Without these flags, watchers would run when form values are set
// programmatically (e.g. on edit load), causing permissions/assets
// to be recalculated incorrectly.
const roleChangedByUser = ref(false);
const organisationChangedByUser = ref(false);



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
watch(() => form.organisation_id, async (id) => {
    if (!id || isNaN(Number(id))) return;
    await userAssignableStore.fetchAssignableResources(id);
}, {
    deep: true
});

// Populate form and base context when editing a user
// (runs on initial mount or when userUuid changes)
watch([() => props.userUuid, getUserScopeByUuid], async ([uuid, userScope]) => {

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
        currentUserPermissions.value = [...perms];
        defaultPermissions.value = [...perms];
        form.permissions = [...perms];

        // Assets
        let assets = userStore.getUserAssetsById(userId);
        if (assets.length === 0) {
            assets = await userStore.fetchUserAssets(userId);
        }
        currentUserAssets.value = [...assets];
        defaultAssets.value = [...assets];
        form.assets = [...assets];



        // Organisations
        let orgs = userStore.getUserOrganisationsById(userId);

        if (orgs.length === 0) {
            orgs = await userStore.fetchUserOrganisations(userId);
        }
        currentUserOrganisations.value = [...orgs];
        defaultOrganisations.value = [...orgs];
        form.organisations = [...orgs];

        // Devices
        let devices = userStore.getUserDevicesById(userId);
        if (devices.length === 0) {
            devices = await userStore.fetchUserDevices(userId);
        }


        currentUserDevices.value = [...devices];
        defaultDevices.value = [...devices];
        form.devices = [...devices];
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

        form.assets = Object.keys(assignable.assets ?? {});
        form.devices = Object.keys(assignable.devices ?? {});
        form.organisations = Object.keys(assignable.organisation ?? {});

        defaultAssets.value = Object.keys(assignable.assets ?? {});
        defaultDevices.value = Object.keys(assignable.devices ?? {});
        defaultOrganisations.value = Object.keys(assignable.organisation ?? {});
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

        form.permissions = [...rolePerms];
        defaultPermissions.value = [...rolePerms];
    }
);


// - Methods -----------------------------------------------------------

function clearMessage() {
    messageStore.clearFlashMessageList();
}

function initUpdateUser() {
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

async function updateUser() {
    try {
        dashboardStore.setIsLoading(true);

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

        const rolePermissions = permissionStore.getRolePermissions[form.role_id!];

        const assignableOrgs = userAssignableStore.getAssignableResources[form.organisation_id!]?.organisation ?? {};
        const assignableOrgsIDs = Object.keys(assignableOrgs);

        const assignableAssets = userAssignableStore.getAssignableResources[form.organisation_id!]?.assets ?? {};
        const assignableAssetsIDs = Object.keys(assignableAssets);

        const assignableDevices = userAssignableStore.getAssignableResources[form.organisation_id!]?.devices ?? {};
        const assignableDevicesIDs = Object.keys(assignableDevices);

        const user_permissions = utils.diffArraysToBooleanMap(rolePermissions, permissions);
        const user_organisation_access = utils.diffArraysToBooleanMap(assignableOrgsIDs, organisations);
        const user_asset_access = utils.diffArraysToBooleanMap(assignableAssetsIDs, assets);
        const user_device_access = utils.diffArraysToBooleanMap(assignableDevicesIDs, devices);

        const payload: Record<string, any> = {};

        if (form.first_name !== user.value?.first_name) {
            payload.first_name = form.first_name;
        }

        if (form.last_name !== user.value?.last_name) {
            payload.last_name = form.last_name;
        }

        if (form.email !== user.value?.email) {
            payload.email = form.email;
        }

        if (form.password && form.password.trim() !== '') {
            payload.password = form.password.trim();
        }

        if (form.active !== user.value?.active) {
            payload.active = form.active;
        }


        // Organisation change      
        if (form.organisation_id !== user.value?.organisation_id) {
            payload.organisation_id = form.organisation_id;
            payload.user_organisation_access = user_organisation_access;
            payload.user_asset_access = user_asset_access;
            payload.user_device_access = user_device_access;

        } else {
            const old_organisation_access =
                utils.diffArraysToBooleanMap(assignableOrgsIDs, currentUserOrganisations.value);

            if (
                JSON.stringify(old_organisation_access) !==
                JSON.stringify(user_organisation_access)
            ) {
                payload.user_organisation_access = user_organisation_access;
            }

            const old_asset_access =
                utils.diffArraysToBooleanMap(assignableAssetsIDs, currentUserAssets.value);

            if (
                JSON.stringify(old_asset_access) !==
                JSON.stringify(user_asset_access)
            ) {
                payload.user_asset_access = user_asset_access;
            }

            const old_device_access =
                utils.diffArraysToBooleanMap(assignableDevicesIDs, currentUserDevices.value);

            if (
                JSON.stringify(old_device_access) !==
                JSON.stringify(user_device_access)
            ) {
                payload.user_device_access = user_device_access;
            }
        }


        // Role / permissions        
        if (form.role_id !== user.value?.role_id) {
            payload.role = form.role_id;
            payload.user_permissions = user_permissions;
        } else {
            const old_permissions =
                utils.diffArraysToBooleanMap(rolePermissions, currentUserPermissions.value);

            if (
                JSON.stringify(old_permissions) !==
                JSON.stringify(user_permissions)
            ) {
                payload.user_permissions = user_permissions;
            }
        }

        if (Object.keys(payload).length === 0) {

            messageStore.setFlashMessagesList(
                ['No changes detected.'],
                'flash-message--orange'
            );
            confirmOn.value = false;
            return;
        }

        const res = await userStore.updateUser(user.value!.id, payload);

        console.log(res);

    } catch (err) {
        handleFormError(err);
        console.error("! UserUpdateView updateUser !", err);
    } finally {
        confirmOn.value = false;
        dashboardStore.setIsLoading(false);
    }
}


</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly</style>