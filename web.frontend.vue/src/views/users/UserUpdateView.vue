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
			<div class="vform__group mb-7">
				<label class="vform__label" for="role">Role <span class="vform__required">*</span></label>
				<VueSelect v-model="form.role_id" class="vform__group" :shouldAutofocusOption="false"
					:isDisabled="confirmOn" :style="[vueSelectStyles, selectErrorStyle(!!errors.role)]"
					:options="roleOptions" placeholder="" />
				<p class="vform__error">{{ errors.role }}</p>
			</div>


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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useOrganisationStore } from "@/stores/organisationStore";
import UserPermissions from "@/components/users/UserPermissions.vue";
import { usePermissionStore } from "@/stores/permissionStore";

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


// - Computed ----------------------------------------------------------

const getOrganisations = computed(() => {
    const orgs = organisationStore.getOrganisationScope || {};

    return Object.values(orgs).map((o: any) => ({
        label: o.name,
        value: o.id,
    }));
});

// - Watchers ----------------------------------------------------------
watch([() => props.userUuid, getUserScopeByUuid], ([uuid, userScope]) =>{

    if (!uuid) return;

    const uu = userScope[uuid]

    if (!uu) return;

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

watch(
    () => user.value,
    async (u) => {
        if (!u) return;

        // 1. Try from cache first
        let perms = userStore.getUserPermissionsById(u.id);

        // 2. If not cached, fetch from API
        if (perms.length === 0) {
            perms = await userStore.fetchUserPermissions(u.id);
        }

        // 3. Apply to form
        defaultPermissions.value = [...perms];
        form.permissions = [...perms];
    },
    { immediate: true }
);


// - Methods -----------------------------------------------------------

function clearMessage() {
    messageStore.clearFlashMessageList();
}


onMounted(()=>{
    // console.log(props.userUuid);
    // console.log(userStore.getUserScopeByUuid[props.userUuid!])
})

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>