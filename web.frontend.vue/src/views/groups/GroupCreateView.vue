<template>
	<form class="vform mt-16" autocomplete="off" @click="clearMessage">
		<div class="vform__row" :class="{ 'vform__disabled': confirmOn }">

			<div class="vform__group mb-7">
				<label class="vform__label" for="device_id">Group Name <span class="vform__required">*</span></label>
				<input v-model.trim="form.name" :class="{ 'vform__input--error': errors.name }" class="vform__input"
					id="device_id" type="text" placeholder="Enter group name" :disabled="confirmOn">
				<p class="vform__error">{{ errors.name }}</p>
			</div>

			<div class="vform__group mb-7">
				<label class="vform__label">Goup Type<span class="vform__required">*</span></label>
				<VueSelect v-model="form.type" 
					:shouldAutofocusOption="false"
					:isDisabled="confirmOn" 
					:style="[vueSelectStyles, selectErrorStyle(!!errors.type)]" class="vform__group"
					:options="[
						{ label: 'Assets Group',  value: 'asset' },
						{ label: 'Devices Group', value: 'device' },
						{ label: 'Users Group',   value: 'user' },
						{ label: 'Organisations Group',   value: 'organisation' },
		
					]" placeholder="" />
				<p class="vform__error">{{ errors.type }}</p>
			</div>

		</div>

		<div class="vform__row mt-9 ">
			<button v-if="!confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="initCreateGroup">Create Group</button>
			<button v-if="confirmOn" class="vbtn vbtn--zinc-lt mt-3" @click.prevent="confirmOn = false">Cancel</button>
			<button v-if="confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="createGroup">Confirm</button>
		</div>
	</form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import VueSelect from "vue3-select-component";
import { useFormErrorHandler } from '@/composables/useFormErrorHandler';
import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";
import { useMessageStore } from '@/stores/messageStore';
import { reactive, ref } from 'vue';
import { useGroupStore } from "@/stores/groupStore";
import { useDashboardStore } from "@/stores/dashboardStore";


// - Composable --------------------------------------------------------

const vueSelectStyles = useVueSelectStyles();

const errors = ref<Record<string, string>>({
	name: '',
	type: '',

});

const { handleFormError } = useFormErrorHandler(errors);

// - Store -------------------------------------------------------------

const messageStore = useMessageStore();
const groupStore = useGroupStore();
const dashboardStore = useDashboardStore();

// - Data --------------------------------------------------------------
const confirmOn = ref(false);

const form = reactive({
	name: null as null | string,
	type: "asset" as null | string,

});

// - Methods -----------------------------------------------------------

function clearMessage() {
	messageStore.clearFlashMessageList();
}

function initCreateGroup() {
    confirmOn.value = true;
    
    errors.value = {
        name: '',
        type: '',   
    };
}

async function createGroup() {
	dashboardStore.setIsLoading(true);
	try {
		const payload: Record<string, string | null> = {
			...form
		}

		const r = await groupStore.createGroup(payload);

		// Success message
        messageStore.setFlashMessagesList([r.data.message], 'flash-message--blue');

		const newGroup = r.data.data.group;

		groupStore.addGroupToStore(newGroup);

		// Reset form fields to defaults     
        Object.assign(form, {
			name: null,
			type: null,        
        });

	} catch (err) {
		handleFormError(err);
		console.error("! OrganisationCreateView createOrganisation !", err);
	} finally {
        confirmOn.value = false;
		dashboardStore.setIsLoading(false);
    }
}

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly

</style>