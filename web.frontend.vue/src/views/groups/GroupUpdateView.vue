<template>
	<form class="vform mt-16 mb-4" autocomplete="off">
		<TheFlashMessage></TheFlashMessage>

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
						// { label: 'Users Group',   value: 'user' },
						// { label: 'Organisations Group',   value: 'organisation' },
		
					]" placeholder="" />
				<p class="vform__error">{{ errors.type }}</p>
			</div>

		</div>

		<UserAssets :confirmOn="confirmOn" :defaultAssets="defaultAssets" @assets-changed="form.assets = $event">
        </UserAssets>

		<UserDevices :confirmOn="confirmOn" :defaultDevices="defaultDevices" @devices-changed="form.devices = $event">
        </UserDevices>


	</form>
</template>

<!-- --------------------------------------------------------------- -->

<script setup lang="ts">
import TheFlashMessage from "@/components/commen/TheFlashMessage.vue";
import { useVueSelectStyles, selectErrorStyle } from "@/composables/useVueSelectStyles";
import { useGroupStore } from "@/stores/groupStore";
import { useMessageStore } from "@/stores/messageStore";
import type { Group } from "@/types/group.type";

import UserOrganisations from "@/components/users/UserOrganisations.vue";
import UserDevices from "@/components/users/UserDevices.vue";
import UserAssets from "@/components/users/UserAssets.vue";

import { storeToRefs } from "pinia";
import { onMounted, reactive, ref, watch } from "vue";
import VueSelect from 'vue3-select-component';
import { useUserAssignableStore } from "@/stores/userAssignableStore";
import { useOrganisationStore } from "@/stores/organisationStore";


const vueSelectStyles = useVueSelectStyles();

const errors = ref<Record<string, string>>({
    name: '',
    type: '',
});

// - Props -------------------------------------------------------------

const props = defineProps<{
    groupUuid?: string | null,
}>();

// - Store -------------------------------------------------------------

const messageStore = useMessageStore();
const groupStore = useGroupStore();

const {getGroups, uuidToIdMap } = storeToRefs(groupStore);

const userAssignableStore = useUserAssignableStore();
const organisationStore = useOrganisationStore();

// -Types --------------------------------------------------------------

type Form = typeof form;

// - Data --------------------------------------------------------------
const confirmOn = ref(false);

const group = ref<null | Group>(null);

const form = reactive({
    id: null as null | string,
    name: null as null | string,
    type: null as null | string,

    assets: [] as string[],
    devices: [] as string[],
	users: [] as string[],
	organisations: [] as string[],
});

const defaultAssets = ref<string[]>([]);
const defaultDevices = ref<string[]>([]);
const defaultUsers = ref<string[]>([]);
const defaultOrganisations = ref<string[]>([]);

// - Watchers ----------------------------------------------------------

watch(
	[() => props.groupUuid, getGroups, uuidToIdMap],
	([groupUuid, groups, idMap]) => {
		console.log(!groupUuid , !groups , !idMap)
		if (!groupUuid || !groups || !idMap) return;

		const groupId = idMap[groupUuid];
        const g: any = groups[groupId];

        if (!g) return;

		// Top-level fields
        form.name = g.name ?? null;
        form.type = g.type ?? null;

		group.value = g;
	},
	{ immediate: true }
)

// - Methods -----------------------------------------------------------

function clearMessage() {
    messageStore.clearFlashMessageList();
}

watch(()=>organisationStore.getOrganisation, async() => {

	const currentOrg = organisationStore.getOrganisation;	

	
	if (currentOrg?.id) {
		await userAssignableStore.fetchAssignableResources(currentOrg.id);
	}
},{
	deep: true,
	immediate: true
})

</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>