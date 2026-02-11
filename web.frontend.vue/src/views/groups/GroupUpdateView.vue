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


		</div>

		<UserAssets v-if="form.type == 'asset'"
			:confirmOn="confirmOn" 
			:defaultAssets="defaultAssets" 
			@assets-changed="form.entities = $event"
			:filterAssetsByUser="true">
        </UserAssets>

		<UserDevices v-if="form.type == 'device'"
			:confirmOn="confirmOn" 
			:defaultDevices="defaultDevices" 
			@devices-changed="form.entities = $event"
			:filterDevicesByUser="true">
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
import { useUserStore } from "@/stores/userStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useDeviceStore } from "@/stores/deviceStore";
import { useAssetStore } from "@/stores/assetStore";



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

const userStore = useUserStore();

const deviceStore = useDeviceStore();


const assetStore = useAssetStore();
const { getAssets } = storeToRefs(assetStore);


// -Types --------------------------------------------------------------

type Form = typeof form;

// - Data --------------------------------------------------------------
const confirmOn = ref(false);

const group = ref<null | Group>(null);

const form = reactive({
    id: null as null | string,
    name: null as null | string,
    type: null as null | string,
    entities: [] as string[],
});

const hiddenAssetIds = ref<string[]>([])
const defaultAssets = ref<string[]>([]);

const defaultDevices = ref<string[]>([]);
const hiddenDeviceIds = ref<string[]>([]);

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
});


watch(
  () => assetStore.getAssetIDs,
  (userAssetIDs) => {

    const groupAssetIds =  ['1', '2', '3', '100']

    const visible: string[] = []
    const hidden: string[] = []

    for (const id of groupAssetIds) {
      if (userAssetIDs?.includes(id)) {
        visible.push(id)
      } else {
        hidden.push(id)
      }
    }

    defaultAssets.value = visible
    hiddenAssetIds.value = hidden

    console.log('visible:', visible)
    console.log('hidden:', hidden)
  },
  {
    immediate: true,
    deep: false
  }
)

watch(
  () => deviceStore.getDevicesIDs,
  (userDeviceIDs) => {

    const groupDeviceIds: string[] =  ["2"]   // ← real backend value later

    const userSet = new Set(userDeviceIDs || [])

    const visible: string[] = []
    const hidden: string[] = []

    for (const id of groupDeviceIds) {
      userSet.has(id) ? visible.push(id) : hidden.push(id)
    }

    defaultDevices.value = visible
    hiddenDeviceIds.value = hidden

    console.log('visible devices:', visible)
    console.log('hidden devices:', hidden)
  },
  {
    immediate: true
  }
)
</script>

<!-- --------------------------------------------------------------- -->

<style lang="scss" scoped>
// Placeholder comment to ensure global styles are imported correctly
</style>