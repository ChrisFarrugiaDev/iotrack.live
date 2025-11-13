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

		<UserPermissions :confirmOn="confirmOn" :permissionsOptions="permissionsOptions"></UserPermissions>

		<UserOrganisations :confirmOn="confirmOn" :organisationsOptions="organisationsOptions" ></UserOrganisations>

	</form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import { useMessageStore } from '@/stores/messageStore';
import { reactive, ref } from 'vue';
import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";


import UserPermissions from "@/components/users/UserPermissions.vue";
import UserOrganisations from "@/components/users/UserOrganisations.vue";


// - Composable --------------------------------------------------------

const vueSelectStyles = useVueSelectStyles();

// - Store -------------------------------------------------------------

const messageStore = useMessageStore();

// - Data --------------------------------------------------------------

const permissionsOptions = [
	{
		id: '100',
		label: "Test",

	},
	{
		id: 'users',
		label: 'Users',
		children: [
			{ id: '1', label: 'Create User' },
			{ id: '2', label: 'Update User' },
			{ id: '3', label: 'Delete User' },
		],
	},
	{
		id: 'organisation',
		label: 'Organisations',
		children: [
			{ id: '4', label: 'Create Organisation' },
			{ id: '5', label: 'Update Organisation' },
			{ id: '6', label: 'Delete Organisation' },
		],
	},
	{
		id: 'devices',
		label: 'Devices',
		children: [
			{ id: '13', label: 'View Devices' },
			{ id: '14', label: 'Create Devices' },
			{ id: '15', label: 'Update Devices' },
			{ id: '16', label: 'Delete Devices' },
		],
	},
];

const organisationsOptions: Record<string, any>[] = [];

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
	permissions: [] as any[],
});

const errors = ref<Record<string, string>>({
	first_name: '',
	last_name: '',
	email: '',
	password: '',
	role: "",
	active: "",
});

// - Methods -----------------------------------------------------------

function clearMessage() {
	messageStore.clearFlashMessageList();
}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
/* Make Treeselect visually match your .vform__input look & feel */
</style>