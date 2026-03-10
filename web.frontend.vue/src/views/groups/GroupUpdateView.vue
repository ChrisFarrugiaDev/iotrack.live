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

		<UserAssets v-if="form.type == 'asset'" :confirmOn="confirmOn" :defaultAssets="defaultEntities"
			@assets-changed="updateEntities" :filterAssetsByUser="true">
		</UserAssets>

		<UserDevices v-if="form.type == 'device'" :confirmOn="confirmOn" :defaultDevices="defaultEntities"
			@devices-changed="updateEntities" :filterDevicesByUser="true">
		</UserDevices>

		<GroupUsers v-if="form.type == 'user'" :confirmOn="confirmOn" :defaultUsers="defaultEntities"
			@users-changed="updateEntities">			
		</GroupUsers>

		<UserOrganisations v-if="form.type == 'organisation'" :confirmOn="confirmOn" :defaultOrganisations="defaultEntities"
			@org-changed="updateEntities">			
		</UserOrganisations>


		<!-- Row 5: Buttons -->
		<div class="vform__row mt-9">
			<button v-if="!confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="initUpdate" type="button">Update
				Device</button>
			<button v-if="confirmOn" class="vbtn vbtn--zinc-lt mt-3" @click.prevent="confirmOn = false"
				type="button">Cancel</button>
			<button v-if="confirmOn" class="vbtn vbtn--sky mt-3" @click.prevent="updateGroup" type="button">Confirm</button>
		</div>

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
import GroupUsers from "@/components/groups/GroupUsers.vue";

import { storeToRefs } from "pinia";
import { reactive, ref, toRaw, watch } from "vue";
import { useUserAssignableStore } from "@/stores/userAssignableStore";
import { useOrganisationStore } from "@/stores/organisationStore";
import { useUserStore } from "@/stores/userStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useDeviceStore } from "@/stores/deviceStore";
import { useAssetStore } from "@/stores/assetStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useFormErrorHandler } from "@/composables/useFormErrorHandler";



const vueSelectStyles = useVueSelectStyles();

const errors = ref<Record<string, string>>({
	name: '',
	type: '',
});

const { handleFormError } = useFormErrorHandler(errors);

// - Props -------------------------------------------------------------

const props = defineProps<{
	groupUuid?: string | null,
}>();

// - Store -------------------------------------------------------------

const messageStore = useMessageStore();
const groupStore = useGroupStore();

const { getGroups, uuidToIdMap } = storeToRefs(groupStore);

const userAssignableStore = useUserAssignableStore();
const organisationStore = useOrganisationStore();

const userStore = useUserStore();
const deviceStore = useDeviceStore();

const assetStore = useAssetStore();

const dashboardStore = useDashboardStore();



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

const entitiesUpdated = ref(false);

const hiddenEntitiesIds = ref<string[]>([]);
const defaultEntities = ref<string[]>([]);
// - Watchers ----------------------------------------------------------

// this is loading the Assets and Devices options
watch(() => organisationStore.getOrganisation, async () => {

	const currentOrg = organisationStore.getOrganisation;


	if (currentOrg?.id) {
		await userAssignableStore.fetchAssignableResources(currentOrg.id);
	}
}, {
	deep: true,
	immediate: true
});

// ---------
type EntityType = 'asset' | 'device' | 'user' | 'organisation'

// Config per type:
// - userIds(): IDs the current user is allowed to see
// - idsKey: key returned by backend for group items
const typeConfig: Record<EntityType, { userIds: () => string[] | undefined; idsKey: string }> = {
  asset: { userIds: () => assetStore.getAssetIDs, idsKey: 'asset_ids' },
  device: { userIds: () => deviceStore.getDevicesIDs, idsKey: 'device_ids' },
  user: { userIds: () => userStore.getUserScopeIDs, idsKey: 'user_ids' },
  organisation: { userIds: () => organisationStore.getOrganisationScopeIDs, idsKey: 'organisation_ids' },
}

watch(
  [
    () => form.type as EntityType, // selected type
    () => form.id,                 // selected group id

    // re-run if user's visible IDs change
    () => assetStore.getAssetIDs,
    () => deviceStore.getDevicesIDs,
    () => userStore.getUserScopeIDs,
    () => organisationStore.getOrganisationScopeIDs,
  ],
  async ([type, groupID], _old, onInvalidate) => {
    // cancel outdated async runs (avoid race conditions)
    let cancelled = false
    onInvalidate(() => { cancelled = true })

    // nothing to do if missing data
    if (!type || !groupID) return

    const cfg = typeConfig[type]
    if (!cfg) return

	

    // fetch group items for current type
    const res = await groupStore.fetchGroupItems(type, groupID)
    if (cancelled) return	

    const groupIds = (res.data?.[cfg.idsKey] ?? []) as string[]

    // split group IDs into visible/hidden based on user permissions
    const userSet = new Set(cfg.userIds() ?? [])

    const visible: string[] = []
    const hidden: string[] = []

    for (const id of groupIds) {
		if (type == 'user') {
			visible.push(String(id));
		} else {

			userSet.has(String(id)) ? visible.push(String(id)) : hidden.push(String(id))
		}
    }

    // update UI state
    defaultEntities.value = visible;
    hiddenEntitiesIds.value = hidden;


	console.log('visible:', visible);
	console.log('hidden:', hidden);

  },
  { immediate: true } // run once on mount
)
// ---------

// - Watchers ----------------------------------------------------------

watch(
	[() => props.groupUuid, getGroups, uuidToIdMap],
	([groupUuid, groups, idMap]) => {

		if (!groupUuid || !groups || !idMap) return;

		const groupId = idMap[groupUuid];
		const g: any = groups[groupId];

		if (!g) return;

		// Top-level fields
		form.name = g.name ?? null;
		form.type = g.type ?? null;
		form.id = g.id ?? null;

		group.value = g;
	},
	{ immediate: true }
)

// - Methods -----------------------------------------------------------

function clearMessage() {
	messageStore.clearFlashMessageList();
}

function updateEntities(entities: string[]) {
	entitiesUpdated.value = true;
	form.entities = entities;
}


function initUpdate() {

	if (!group.value) return;

	    confirmOn.value = true;

    errors.value = {
		name: '',
		type: '',
    };
}

async function updateGroup() {

	
	try {

		dashboardStore.setIsLoading(true);
		
		for (let i = 0; i < hiddenEntitiesIds.value.length; i++) {
	
			if (!form.entities.includes(hiddenEntitiesIds.value[i])) {
	
				form.entities.push(hiddenEntitiesIds.value[i]);
			}
		}

		const payload: { type: string, name?: string, entities_ids?: string[] } = {
			type: form.type!
		};

		if (form.name && group.value?.name != form.name) {
			payload.name = form.name;
		}
		if (entitiesUpdated) {
			payload.entities_ids = form.entities;
		}

		const r = await groupStore.updateGroup(form.id!, payload);

		messageStore.setFlashMessagesList([r.data.message], 'flash-message--blue');

		groupStore.updateGroupsItemsInStore(r.data.data.group.id, r.data.data.group.items)

	} catch (err) {
		handleFormError(err);
		console.error("! GroupUpdateView updateGroup !", err);
		
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